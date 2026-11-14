#!/usr/bin/env python3
"""AnalogOS Chile - Stage 2 "Same scale, two planets".

Produces, for the SAME 50 km x 50 km ground extent on Earth and Mars:
  assets/earth-relief.png   Copernicus DEM GLO-30 (AWS Open Data, no login), block-mean to 463 m/px, hillshade
  assets/mars-relief.png    MOLA MEGDR 128 px/deg (NASA PDS), resampled to the same 463 m/px grid, same hillshade
  assets/earth-imagery.jpg  NASA GIBS WMS GetMap, true color, exact bbox
  assets/mars-imagery.jpg   NASA Mars Trek WMTS mosaic (CTX if available, else Viking colour), exact bbox
  assets/scale-notes.json   bbox, pixel size, m/px, sources and slope stats for each output

Rule (project spec): degrade ELEVATION first (463 m), THEN compute slope / hillshade.
No credentials are needed or used.

Run (internet required):
  python3 -m venv .venv && source .venv/bin/activate
  pip install numpy pillow requests tifffile imagecodecs
  python make_stage2_images.py            # writes ./assets
"""
import argparse, io, json, math, os, re, sys, datetime
import xml.etree.ElementTree as ET

import numpy as np
import requests
from PIL import Image

PX_M = 463.0                      # MOLA 128 px/deg at the equator
EXTENT_M = 50000.0
N = int(round(EXTENT_M / PX_M))   # 108 px
EARTH_R = 6371008.8
MARS_R = 3396190.0
EARTH_C = dict(lat=-22.90, lon=-68.25)   # Valle de Marte, Atacama
MARS_C = dict(lat=18.40, lon=77.30)      # western rim of Jezero crater
AZIMUTH, ALTITUDE, Z_FACTOR = 315.0, 45.0, 1.0   # identical for both planets
UPSCALE = 5                        # display upscale, nearest neighbour (no smoothing)
IMG_PX = N * UPSCALE               # 540 px imagery, same frame as the relief

HTTP = requests.Session()
HTTP.headers["User-Agent"] = "AnalogOS-Chile/1.0 (NASA Space Apps Challenge 2026)"


def log(*a):
    print(*a, flush=True)


def bbox(c, R):
    dlat = math.degrees(EXTENT_M / R)
    dlon = math.degrees(EXTENT_M / (R * math.cos(math.radians(c["lat"]))))
    return dict(south=c["lat"] - dlat / 2, north=c["lat"] + dlat / 2,
                west=c["lon"] - dlon / 2, east=c["lon"] + dlon / 2, dlat=dlat, dlon=dlon)


def local_xy(lat, lon, c, R):
    """Local tangent-plane metres (east, north) around the centre. Error < 0.1 % over 50 km."""
    x = np.radians(lon - c["lon"]) * R * math.cos(math.radians(c["lat"]))
    y = np.radians(lat - c["lat"]) * R
    return x, y


def grid_latlon(c, R):
    """Lat/lon of the centres of the N x N target grid (row 0 = north)."""
    off = (np.arange(N) + 0.5) * PX_M - EXTENT_M / 2
    x, y = np.meshgrid(off, -off)
    lat = c["lat"] + np.degrees(y / R)
    lon = c["lon"] + np.degrees(x / (R * math.cos(math.radians(c["lat"]))))
    return lat, lon


def download(url, path, chunk=1 << 20):
    if os.path.exists(path) and os.path.getsize(path) > 0:
        return path
    log("  downloading", url)
    with HTTP.get(url, stream=True, timeout=120) as r:
        r.raise_for_status()
        tmp = path + ".part"
        with open(tmp, "wb") as f:
            for b in r.iter_content(chunk):
                f.write(b)
        os.replace(tmp, path)
    return path


# ---------------------------------------------------------------- relief
def hillshade(z):
    z = np.where(np.isfinite(z), z, np.nanmean(z)) * Z_FACTOR
    gy, gx = np.gradient(z, PX_M)          # rows run north->south, cols west->east
    dzdx, dzdy = gx, -gy                   # east, north
    slope = np.arctan(np.hypot(dzdx, dzdy))
    aspect = np.arctan2(-dzdx, -dzdy)      # downslope direction, clockwise from north
    az, alt = math.radians(AZIMUTH), math.radians(ALTITUDE)
    hs = math.sin(alt) * np.cos(slope) + math.cos(alt) * np.sin(slope) * np.cos(az - aspect)
    return np.clip(hs, 0, 1), np.degrees(slope)


def relief_stats(z, slope_deg):
    win = 5
    pad = win // 2
    zp = np.pad(z, pad, mode="edge")
    rel = np.empty_like(z)
    for i in range(z.shape[0]):
        for j in range(z.shape[1]):
            w = zp[i:i + win, j:j + win]
            rel[i, j] = np.nanpercentile(w, 95) - np.nanpercentile(w, 5)
    return {
        "slope_median_deg": round(float(np.nanmedian(slope_deg)), 2),
        "slope_p90_deg": round(float(np.nanpercentile(slope_deg, 90)), 2),
        "local_relief_p95_p5_median_m": round(float(np.nanmedian(rel)), 1),
        "elevation_range_m": [round(float(np.nanmin(z)), 1), round(float(np.nanmax(z)), 1)],
    }


def save_relief(hs, path):
    img = Image.fromarray((hs * 255).astype(np.uint8), "L")
    img.resize((N * UPSCALE, N * UPSCALE), Image.NEAREST).save(path, optimize=True)


# ---------------------------------------------------------------- Earth DEM
def copernicus_name(lat_floor, lon_floor):
    ns = "N" if lat_floor >= 0 else "S"
    ew = "E" if lon_floor >= 0 else "W"
    return f"Copernicus_DSM_COG_10_{ns}{abs(lat_floor):02d}_00_{ew}{abs(lon_floor):03d}_00_DEM"


def earth_relief(cache):
    import tifffile
    c, R = EARTH_C, EARTH_R
    bb = bbox(c, R)
    sums = np.zeros(N * N)
    cnts = np.zeros(N * N)
    tiles = []
    for lat_f in range(math.floor(bb["south"]), math.floor(bb["north"]) + 1):
        for lon_f in range(math.floor(bb["west"]), math.floor(bb["east"]) + 1):
            name = copernicus_name(lat_f, lon_f)
            url = f"https://copernicus-dem-30m.s3.amazonaws.com/{name}/{name}.tif"
            path = download(url, os.path.join(cache, name + ".tif"))
            tiles.append(url)
            with tifffile.TiffFile(path) as t:
                p = t.pages[0]
                z = p.asarray().astype("float64")
                sx, sy = p.tags["ModelPixelScaleTag"].value[:2]
                tp = p.tags["ModelTiepointTag"].value
                lon0, lat0 = tp[3], tp[4]
            lons = lon0 + (np.arange(z.shape[1]) + 0.5) * sx
            lats = lat0 - (np.arange(z.shape[0]) + 0.5) * sy
            rsel = np.where((lats >= bb["south"] - 0.01) & (lats <= bb["north"] + 0.01))[0]
            csel = np.where((lons >= bb["west"] - 0.01) & (lons <= bb["east"] + 0.01))[0]
            if rsel.size == 0 or csel.size == 0:
                continue
            z = z[rsel[0]:rsel[-1] + 1, csel[0]:csel[-1] + 1]
            z[z < -1000] = np.nan
            LON, LAT = np.meshgrid(lons[csel[0]:csel[-1] + 1], lats[rsel[0]:rsel[-1] + 1])
            x, y = local_xy(LAT, LON, c, R)
            j = np.floor((x + EXTENT_M / 2) / PX_M).astype(int)
            i = np.floor((EXTENT_M / 2 - y) / PX_M).astype(int)
            ok = (i >= 0) & (i < N) & (j >= 0) & (j < N) & np.isfinite(z)
            idx = i[ok] * N + j[ok]
            sums += np.bincount(idx, weights=z[ok], minlength=N * N)
            cnts += np.bincount(idx, minlength=N * N)
    if (cnts == 0).any():
        raise SystemExit(f"Earth DEM does not cover the whole bbox ({int((cnts == 0).sum())} empty px).")
    z = (sums / cnts).reshape(N, N)
    log(f"  Earth block-mean: {int(cnts.min())}-{int(cnts.max())} source px (30 m) per 463 m px")
    return z, bb, tiles, int(cnts.min()), int(cnts.max())


# ---------------------------------------------------------------- Mars DEM
MEGDR = "https://pds-geosciences.wustl.edu/mgs/mgs-m-mola-5-megdr-l3-v1/mgsl_300x/meg128/"


def lbl_value(text, key):
    m = re.search(r"^\s*" + key + r"\s*=\s*\"?([^\"\s<]+)", text, re.M)
    return m.group(1) if m else None


def find_megdr_tile(lat, lon):
    """Read the official directory and labels; never guess the file name."""
    html = HTTP.get(MEGDR, timeout=60).text
    labels = sorted(set(re.findall(r'href="([^"]*megt[^"/]*\.lbl)"', html, re.I)))
    if not labels:
        raise SystemExit("No MEGDR topography labels found at " + MEGDR)
    for href in labels:
        url = requests.compat.urljoin(MEGDR, href)
        t = HTTP.get(url, timeout=60).text
        mx, mn = float(lbl_value(t, "MAXIMUM_LATITUDE")), float(lbl_value(t, "MINIMUM_LATITUDE"))
        w, e = float(lbl_value(t, "WESTERNMOST_LONGITUDE")), float(lbl_value(t, "EASTERNMOST_LONGITUDE"))
        lo, hi = min(w, e), max(w, e)
        if mn <= lat <= mx and lo <= lon % 360 <= hi:
            img = lbl_value(t, r"\^IMAGE") or lbl_value(t, r"\^TOPOGRAPHY")
            img = img.strip('"()').split(",")[0].strip('"')
            return dict(label=url, image=requests.compat.urljoin(url, img),
                        maxlat=mx, minlat=mn, west=lo, east=hi,
                        lines=int(lbl_value(t, "LINES")), samples=int(lbl_value(t, "LINE_SAMPLES")),
                        bits=int(lbl_value(t, "SAMPLE_BITS")),
                        stype=lbl_value(t, "SAMPLE_TYPE") or "MSB_INTEGER",
                        res=float(lbl_value(t, "MAP_RESOLUTION")),
                        scale=float(lbl_value(t, "SCALING_FACTOR") or 1),
                        offset=float(lbl_value(t, "OFFSET") or 0))
    raise SystemExit("No MEGDR tile covers the Mars centre.")


def read_rows(info, r0, r1, cache):
    """Fetch rows [r0, r1) with an HTTP Range request; fall back to the whole file."""
    bpp = info["bits"] // 8
    row = info["samples"] * bpp
    dt = np.dtype(">i2" if "MSB" in info["stype"].upper() else "<i2")
    hdr = {"Range": f"bytes={r0 * row}-{r1 * row - 1}"}
    r = HTTP.get(info["image"], headers=hdr, timeout=180)
    if r.status_code == 206 and len(r.content) == (r1 - r0) * row:
        buf = r.content
    else:
        path = download(info["image"], os.path.join(cache, os.path.basename(info["image"])))
        with open(path, "rb") as f:
            f.seek(r0 * row)
            buf = f.read((r1 - r0) * row)
    a = np.frombuffer(buf, dtype=dt).reshape(r1 - r0, info["samples"]).astype("float64")
    return a * info["scale"] + info["offset"]


def bilinear(z, rows_f, cols_f):
    r0 = np.clip(np.floor(rows_f).astype(int), 0, z.shape[0] - 2)
    c0 = np.clip(np.floor(cols_f).astype(int), 0, z.shape[1] - 2)
    fr, fc = rows_f - r0, cols_f - c0
    return (z[r0, c0] * (1 - fr) * (1 - fc) + z[r0 + 1, c0] * fr * (1 - fc)
            + z[r0, c0 + 1] * (1 - fr) * fc + z[r0 + 1, c0 + 1] * fr * fc)


def mars_relief(cache):
    c, R = MARS_C, MARS_R
    bb = bbox(c, R)
    info = find_megdr_tile(c["lat"], c["lon"])
    log("  MEGDR tile:", info["image"])
    ppd = info["res"]
    r0 = max(int(math.floor((info["maxlat"] - bb["north"]) * ppd)) - 2, 0)
    r1 = min(int(math.ceil((info["maxlat"] - bb["south"]) * ppd)) + 2, info["lines"])
    z = read_rows(info, r0, r1, cache)
    lat, lon = grid_latlon(c, R)
    rows_f = (info["maxlat"] - lat) * ppd - 0.5 - r0
    cols_f = ((lon % 360) - info["west"]) * ppd - 0.5
    return bilinear(z, rows_f, cols_f), bb, info


# ---------------------------------------------------------------- imagery
def earth_imagery(bb, path, date):
    layers = ["MODIS_Terra_CorrectedReflectance_TrueColor", "VIIRS_SNPP_CorrectedReflectance_TrueColor"]
    for layer in layers:
        params = dict(SERVICE="WMS", VERSION="1.1.1", REQUEST="GetMap", LAYERS=layer, STYLES="",
                      SRS="EPSG:4326", FORMAT="image/jpeg", WIDTH=IMG_PX, HEIGHT=IMG_PX, TIME=date,
                      BBOX=f"{bb['west']},{bb['south']},{bb['east']},{bb['north']}")
        r = HTTP.get("https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi", params=params, timeout=120)
        if r.ok and r.headers.get("content-type", "").startswith("image/"):
            Image.open(io.BytesIO(r.content)).convert("RGB").save(path, quality=90)
            return dict(source="NASA GIBS WMS", layer=layer, date=date, url=r.url)
        log("  GIBS layer failed:", layer, r.status_code, r.text[:200])
    return None


TREK_LAYERS = [
    "Mars_MRO_CTX_mosaic_beta01_200ppd",
    "Mars_Viking_MDIM21_ClrMosaic_global_232m",
]


def wmts_capabilities(layer):
    url = f"https://trek.nasa.gov/tiles/Mars/EQ/{layer}/1.0.0/WMTSCapabilities.xml"
    r = HTTP.get(url, timeout=60)
    if not r.ok or b"TileMatrix" not in r.content:
        return None
    root = ET.fromstring(r.content)
    tag = lambda e: e.tag.rsplit("}", 1)[-1]
    template = None
    for e in root.iter():
        if tag(e) == "ResourceURL" and e.get("template"):
            template = e.get("template")
    tms_id, matrices = None, []
    for tms in root.iter():
        if tag(tms) != "TileMatrixSet" or not list(tms):
            continue
        for ch in tms:
            if tag(ch) == "Identifier":
                tms_id = ch.text
            if tag(ch) == "TileMatrix":
                d = {tag(x): x.text for x in ch}
                matrices.append(dict(id=d["Identifier"], w=int(d["MatrixWidth"]), h=int(d["MatrixHeight"]),
                                     tw=int(d.get("TileWidth", 256)), th=int(d.get("TileHeight", 256))))
        if matrices:
            break
    if not template or not matrices:
        return None
    return dict(layer=layer, url=url, template=template, tms=tms_id, matrices=matrices)


def mars_imagery(bb, path):
    target_dpp = bb["dlat"] / IMG_PX
    for layer in TREK_LAYERS:
        cap = wmts_capabilities(layer)
        if not cap:
            log("  Mars Trek layer not available:", layer)
            continue
        # global equirectangular: lon -180..180, lat 90..-90
        m = None
        for mm in cap["matrices"]:
            m = mm
            if 180.0 / (mm["h"] * mm["th"]) <= target_dpp:
                break
        dlon_t, dlat_t = 360.0 / m["w"], 180.0 / m["h"]
        lon = lambda x: x - 360 if x > 180 else x
        w, e = lon(bb["west"]), lon(bb["east"])
        c0, c1 = int((w + 180) // dlon_t), int((e + 180) // dlon_t)
        r0, r1 = int((90 - bb["north"]) // dlat_t), int((90 - bb["south"]) // dlat_t)
        if (c1 - c0 + 1) * (r1 - r0 + 1) > 400:
            log("  too many tiles, skipping", layer)
            continue
        mosaic = Image.new("RGB", ((c1 - c0 + 1) * m["tw"], (r1 - r0 + 1) * m["th"]))
        ok = True
        for r in range(r0, r1 + 1):
            for cc in range(c0, c1 + 1):
                u = (cap["template"].replace("{TileMatrixSet}", cap["tms"] or "default028mm")
                     .replace("{TileMatrix}", m["id"]).replace("{TileRow}", str(r)).replace("{TileCol}", str(cc)))
                t = HTTP.get(u, timeout=60)
                if not t.ok or not t.headers.get("content-type", "").startswith("image/"):
                    ok = False
                    break
                mosaic.paste(Image.open(io.BytesIO(t.content)).convert("RGB"),
                             ((cc - c0) * m["tw"], (r - r0) * m["th"]))
            if not ok:
                break
        if not ok:
            log("  tile download failed for", layer)
            continue
        ppx, ppy = m["tw"] / dlon_t, m["th"] / dlat_t
        box = ((w + 180 - c0 * dlon_t) * ppx, (90 - bb["north"] - r0 * dlat_t) * ppy,
               (e + 180 - c0 * dlon_t) * ppx, (90 - bb["south"] - r0 * dlat_t) * ppy)
        mosaic.crop(tuple(int(round(v)) for v in box)).resize((IMG_PX, IMG_PX), Image.LANCZOS).save(path, quality=90)
        return dict(source="NASA Mars Trek WMTS", layer=layer, tile_matrix=m["id"],
                    source_deg_per_px=180.0 / (m["h"] * m["th"]), capabilities=cap["url"])
    return None


# ---------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default=os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets"))
    ap.add_argument("--cache", default=os.path.join(os.path.dirname(os.path.abspath(__file__)), ".cache"))
    ap.add_argument("--earth-date", default="2025-12-15", help="GIBS date (clear austral summer default)")
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    os.makedirs(a.cache, exist_ok=True)
    notes = dict(generated=datetime.datetime.utcnow().isoformat() + "Z", extent_m=EXTENT_M, grid_px=N,
                 m_per_px=PX_M, display_upscale=UPSCALE, display_resampling="nearest",
                 hillshade=dict(azimuth=AZIMUTH, altitude=ALTITUDE, z_factor=Z_FACTOR),
                 method="Elevation degraded to 463 m first, then slope/hillshade computed (project rule).",
                 outputs={})

    log("Earth relief (Copernicus GLO-30)...")
    ze, bbe, tiles, nmin, nmax = earth_relief(a.cache)
    hs, sl = hillshade(ze)
    save_relief(hs, os.path.join(a.out, "earth-relief.png"))
    notes["outputs"]["earth-relief.png"] = dict(
        bbox=bbe, center=EARTH_C, radius_m=EARTH_R, source="Copernicus DEM GLO-30 (AWS Open Data)", tiles=tiles,
        resampling=f"block mean of 30 m pixels ({nmin}-{nmax} per output px)",
        projection="local tangent plane around the centre (equivalent to UTM 19S within 0.1 % over 50 km)",
        px=[N, N], display_px=[N * UPSCALE] * 2, m_per_px=PX_M, stats=relief_stats(ze, sl))

    log("Mars relief (MOLA MEGDR)...")
    zm, bbm, info = mars_relief(a.cache)
    hs, sl = hillshade(zm)
    save_relief(hs, os.path.join(a.out, "mars-relief.png"))
    notes["outputs"]["mars-relief.png"] = dict(
        bbox=bbm, center=MARS_C, radius_m=MARS_R, source="MOLA MEGDR 128 px/deg (NASA PDS Geosciences)",
        label=info["label"], image=info["image"],
        resampling="bilinear from native 128 px/deg (463 m N-S, ~439 m E-W at 18.4 N) to a square 463 m grid",
        px=[N, N], display_px=[N * UPSCALE] * 2, m_per_px=PX_M, stats=relief_stats(zm, sl))

    log("Earth imagery (GIBS)...")
    meta = earth_imagery(bbe, os.path.join(a.out, "earth-imagery.jpg"), a.earth_date)
    if meta:
        notes["outputs"]["earth-imagery.jpg"] = dict(bbox=bbe, px=[IMG_PX] * 2, m_per_px=EXTENT_M / IMG_PX, **meta)

    log("Mars imagery (Mars Trek)...")
    meta = mars_imagery(bbm, os.path.join(a.out, "mars-imagery.jpg"))
    if meta:
        notes["outputs"]["mars-imagery.jpg"] = dict(bbox=bbm, px=[IMG_PX] * 2, m_per_px=EXTENT_M / IMG_PX, **meta)
    else:
        log("  !! No Mars Trek imagery endpoint answered; mars-imagery.jpg skipped.")

    with open(os.path.join(a.out, "scale-notes.json"), "w") as f:
        json.dump(notes, f, indent=2, ensure_ascii=False)
    log("\nDone. Outputs in", a.out)
    for k, v in notes["outputs"].items():
        log(f"  {k}: {v['px']} px, {v['m_per_px']:.1f} m/px", v.get("stats", ""))


if __name__ == "__main__":
    main()

import requests
from bs4 import BeautifulSoup
from datetime import datetime, date
import pandas as pd
import re

URL = "https://grandorder.gamepress.gg/summon-banner-list"
NA_DELAY_YEARS = 2
#OUTPUT_PATH = r"C:\Nerd Projects\FGO-NA-Banners\fgo-banners\public\banners.csv"
OUTPUT_PATH = "/home/justin/Website/FGO-Site/fgo-banners/dist/banners.csv"

dateToday = date(datetime.now().year, datetime.now().month, datetime.now().day)
dateTodayAdjusted = date(datetime.now().year - NA_DELAY_YEARS, datetime.now().month, datetime.now().day)

print("Fetching banner list...")
r = requests.get(URL, headers={"User-Agent": "Mozilla/5.0"})
soup = BeautifulSoup(r.text, "html.parser")
rows = soup.select(".table-row-group .table-row")
print(f"Found {len(rows)} total rows")

NAFutureBanners = []
NAPastBanners   = []
NAActiveBanners = []

for row in rows:
    rowString = row.text.strip()

    # JP-only rows: predict NA date by adding 2 years
    if not re.findall("NA:", rowString):
        dateSearch = (
            re.findall(r"Japan:\d{4}-\d{2}-\d{2}to\d{4}-\d{2}-\d{2}", rowString) or
            re.findall(r"Japan:\d{4}-\d{2}-\d{2}to\d{4}-\d{2}\d{2}",   rowString)
        )
        if dateSearch:
            bannerDate = date(
                int(dateSearch[0][6:10]),
                int(dateSearch[0][11:13]),
                int(dateSearch[0][14:16])
            )
            if bannerDate >= dateTodayAdjusted:
                NAFutureBanners.append(row)

    # Rows that already have a confirmed NA date
    if re.findall("NA:", rowString) and re.findall("Japan:", rowString):
        dateSearch = (
            re.findall(r"NA:\d{4}-\d{2}-\d{2}to\d{4}-\d{2}-\d{2}", rowString) or
            re.findall(r"NA:\d{4}-\d{2}-\d{2}to\d{4}-\d{2}\d{2}",   rowString)
        )
        if dateSearch:
            bannerStartDate = date(int(dateSearch[0][3:7]),  int(dateSearch[0][8:10]),  int(dateSearch[0][11:13]))
            bannerEndDate   = date(int(dateSearch[0][15:19]), int(dateSearch[0][20:22]), int(dateSearch[0][23:25]))
            if bannerEndDate < dateToday:
                NAPastBanners.append(row)
            elif bannerStartDate <= dateToday <= bannerEndDate:
                NAActiveBanners.append(row)

# Drop the last 2 future rows (stray/footer entries on the page)
for _ in range(min(2, len(NAFutureBanners))):
    NAFutureBanners.pop()

print(f"  Upcoming (predicted): {len(NAFutureBanners)}")
print(f"  Active   (live NA):   {len(NAActiveBanners)}")
print(f"  Past     (real NA):   {len(NAPastBanners)}")


def extract_servants(text):
    """Return servant list as a comma-separated string."""
    if "Single" in text:
        raw = text[text.find("Single") + len("Single"):]
    elif "Shared" in text:
        raw = text[text.find("Shared") + len("Shared"):]
    else:
        return ""
    # Newline-separated names -> comma-separated
    return re.sub(r"\s*\n\s*", ", ", raw.strip()).strip()


records = []

# --- Upcoming: JP dates + 2 years ---
for banner in NAFutureBanners:
    img      = banner.find("img")
    imageUrl = img["src"].split("?")[0] if img else ""
    text     = banner.text.strip()

    dateSearch = (
        re.findall(r"Japan:\d{4}-\d{2}-\d{2}to\d{4}-\d{2}-\d{2}", text) or
        re.findall(r"Japan:\d{4}-\d{2}-\d{2}to\d{4}-\d{2}\d{2}",   text)
    )
    if not dateSearch:
        continue

    predStart = date(int(dateSearch[0][6:10])  + NA_DELAY_YEARS, int(dateSearch[0][11:13]), int(dateSearch[0][14:16]))
    predEnd   = date(int(dateSearch[0][18:22]) + NA_DELAY_YEARS, int(dateSearch[0][23:25]), int(dateSearch[0][26:28]))

    records.append({
        "Banner Name":        text[4:text.find("Period")].strip(),
        "Predicted NA Dates": f"{predStart} to {predEnd}",
        "Featured Servants":  extract_servants(text),
        "Image URL":          imageUrl,
        "Status":             "Upcoming",
    })

# --- Active: confirmed NA dates, currently live ---
for banner in NAActiveBanners:
    img      = banner.find("img")
    imageUrl = img["src"].split("?")[0] if img else ""
    text     = banner.text.strip()

    dateSearch = (
        re.findall(r"NA:\d{4}-\d{2}-\d{2}to\d{4}-\d{2}-\d{2}", text) or
        re.findall(r"NA:\d{4}-\d{2}-\d{2}to\d{4}-\d{2}\d{2}",   text)
    )
    if not dateSearch:
        continue

    start = date(int(dateSearch[0][3:7]),  int(dateSearch[0][8:10]),  int(dateSearch[0][11:13]))
    end   = date(int(dateSearch[0][15:19]), int(dateSearch[0][20:22]), int(dateSearch[0][23:25]))

    records.append({
        "Banner Name":        text[4:text.find("Period")].strip(),
        "Predicted NA Dates": f"{start} to {end}",
        "Featured Servants":  extract_servants(text),
        "Image URL":          imageUrl,
        "Status":             "Active",
    })

# --- Past: confirmed NA dates, already ended ---
for banner in NAPastBanners:
    img      = banner.find("img")
    imageUrl = img["src"].split("?")[0] if img else ""
    text     = banner.text.strip()

    dateSearch = (
        re.findall(r"NA:\d{4}-\d{2}-\d{2}to\d{4}-\d{2}-\d{2}", text) or
        re.findall(r"NA:\d{4}-\d{2}-\d{2}to\d{4}-\d{2}\d{2}",   text)
    )
    if not dateSearch:
        continue

    start = date(int(dateSearch[0][3:7]),  int(dateSearch[0][8:10]),  int(dateSearch[0][11:13]))
    end   = date(int(dateSearch[0][15:19]), int(dateSearch[0][20:22]), int(dateSearch[0][23:25]))

    records.append({
        "Banner Name":        text[4:text.find("Period")].strip(),
        "Predicted NA Dates": f"{start} to {end}",
        "Featured Servants":  extract_servants(text),
        "Image URL":          imageUrl,
        "Status":             "Past",
    })

# --- Export ---
df = pd.DataFrame(records, columns=["Banner Name", "Predicted NA Dates", "Featured Servants", "Image URL", "Status"])
df.to_csv(OUTPUT_PATH, index=False, encoding="utf-8-sig")

print(f"\nSaved {len(df)} banners to:\n  {OUTPUT_PATH}")
print(df[["Banner Name", "Predicted NA Dates", "Status"]].to_string())
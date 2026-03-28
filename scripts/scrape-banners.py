import requests
from bs4 import BeautifulSoup
from datetime import datetime, timedelta, date
from dateutil.relativedelta import relativedelta
import pandas as pd
import re

URL = "https://grandorder.gamepress.gg/summon-banner-list"
NA_DELAY_YEARS = 2

dateToday = date(datetime.now().year, datetime.now().month, datetime.now().day)
dateTodayAdjusted = date(datetime.now().year - NA_DELAY_YEARS, datetime.now().month, datetime.now().day)
r = requests.get(URL)
soup = BeautifulSoup(r.text, 'html.parser')
rows = soup.select('.table-row-group .table-row')
naBanners = []
predictedDates = []
possibleServants = []
names = []
bannerImages = []

for row in rows:
    rowString = row.text.strip()
    if not re.findall("NA:", rowString):
        dateSearch = re.findall(r"Japan:\d{4}-\d{2}-\d{2}to\d{4}-\d{2}-\d{2}",rowString) or re.findall(r"Japan:\d{4}-\d{2}-\d{2}to\d{4}-\d{2}\d{2}",rowString)
        if dateSearch:
            bannerDate = date(int(dateSearch[0][6:10]), int(dateSearch[0][11:13]), int(dateSearch[0][14:16]))

            if (bannerDate >= dateTodayAdjusted):
                naBanners.append(row)
for i in range(2):
    naBanners.pop()

for banner in naBanners:

    img = banner.find("img")
    imageUrl = img["src"].split("?")[0] if img else ""
    bannerImages.append(imageUrl)

    banner = banner.text.strip()
    dateSearch = re.findall(r"Japan:\d{4}-\d{2}-\d{2}to\d{4}-\d{2}-\d{2}",banner) or re.findall(r"Japan:\d{4}-\d{2}-\d{2}to\d{4}-\d{2}\d{2}",banner)
    predStartDate = date(int(dateSearch[0][6:10]) + NA_DELAY_YEARS, int(dateSearch[0][11:13]), int(dateSearch[0][14:16]))
    predEndDate = date(int(dateSearch[0][18:22]) + NA_DELAY_YEARS, int(dateSearch[0][23:25]), int(dateSearch[0][26:28]))
    predictedDates.append(str(predStartDate) + " to " + str(predEndDate))
    
    name = banner[4:banner.find("Period")].strip()
    names.append(name)

    possibleServant = banner[banner.find("Single") + 6:].strip()
    possibleServants.append(possibleServant)

df = pd.DataFrame({
    "Banner Name": names,
    "Predicted NA Dates": predictedDates,
    "Featured Servants": possibleServants,
    "Image URL": bannerImages
})

df.to_csv("fgo_na_predicted_banners_" + str(dateToday) + ".csv", index=False)
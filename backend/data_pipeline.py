# data_pipeline.py
from datetime import datetime, timedelta
import pandas as pd
import matplotlib.pyplot as plt
import time
import multiprocessing as mp
import openmeteo_requests
import requests_cache
from retry_requests import retry

nasa_csv_path = '/Users/meghanagopu/Documents/GitHub/blazepath_app_repo/backend/Wildfire_data_2022-2025.csv'
nasa = pd. read_csv(nasa_csv_path)
#removed all duplicated
nasa[nasa.duplicated(subset=['acq_date', 'acq_time'])]
nasa.drop_duplicates(subset=['acq_date', 'acq_time'], inplace=True)
# Step 1: Convert date columns to consistent format
nasa['acq_date'] = pd.to_datetime(nasa['acq_date'], format='%m/%d/%y')
# Step 2: Convert time column to match weather format
nasa['acq_time'] = nasa['acq_time'].astype(str).str.zfill(4)  # Ensure leading zeros for hours < 10
nasa['acq_time'] = pd.to_datetime(nasa['acq_time'], format='%H%M').dt.time
#setting date time formate
nasa['acq_time'] = pd.to_datetime(nasa['acq_time'], format='%H:%M:%S')
# Round to the nearest hour
nasa['round_time'] = nasa['acq_time'].dt.round('H')
# Convert back to time format (HH:MM:SS)
nasa['round_time'] = nasa['round_time'].dt.time
nasa['acq_time'] = nasa['acq_time'].dt.time
#removing time component from date column
nasa['acq_date'] = pd.to_datetime(nasa['acq_date']).dt.date

nasa

#starting data collection from API
#create empty dataframe to hold API info
hourly_dataframe = pd.DataFrame()

# Setup the Open-Meteo API client with cache and retry on error
cache_session = requests_cache.CachedSession('.cache', expire_after = -1)
retry_session = retry(cache_session, retries = 5, backoff_factor = 0.2)
openmeteo = openmeteo_requests.Client(session = retry_session)
url = "https://archive-api.open-meteo.com/v1/archive"

#iterating over lat and long columm and fetching weather data
for index, row in nasa.iterrows():
   print('This is row--->',index)
   print(row["latitude"], row["longitude"], row['acq_date'])
  
   #37.45576 -121.93266 2020-01-04
   params = {
     "latitude": row["latitude"],
     "longitude": row["longitude"],
     "start_date": row['acq_date'],
     "end_date": row['acq_date'],
     "hourly": ["temperature_2m", "relative_humidity_2m", "dew_point_2m", "apparent_temperature", "precipitation", "rain", "snowfall", "snow_depth", "weather_code", "pressure_msl", "surface_pressure", "cloud_cover", "cloud_cover_low", "cloud_cover_mid", "cloud_cover_high", "et0_fao_evapotranspiration", "vapour_pressure_deficit", "wind_speed_10m", "wind_speed_100m", "wind_direction_10m", "wind_direction_100m", "wind_gusts_10m", "soil_temperature_0_to_7cm", "soil_temperature_7_to_28cm", "soil_temperature_28_to_100cm", "soil_temperature_100_to_255cm", "soil_moisture_0_to_7cm", "soil_moisture_7_to_28cm", "soil_moisture_28_to_100cm", "soil_moisture_100_to_255cm"],
     "timezone": "America/Los_Angeles"
   }
   responses = openmeteo.weather_api(url, params=params)
   response = responses[0]
   print(f"Coordinates {response.Latitude()}°N {response.Longitude()}°E")
   print(f"Elevation {response.Elevation()} m asl")
   print(f"Timezone {response.Timezone()} {response.TimezoneAbbreviation()}")
   print(f"Timezone difference to GMT+0 {response.UtcOffsetSeconds()} s")
  
   # Process hourly data. The order of variables needs to be the same as requested.
   hourly = response.Hourly()
   hourly_temperature_2m = hourly.Variables(0).ValuesAsNumpy()
   hourly_relative_humidity_2m = hourly.Variables(1).ValuesAsNumpy()
   hourly_dew_point_2m = hourly.Variables(2).ValuesAsNumpy()
   hourly_apparent_temperature = hourly.Variables(3).ValuesAsNumpy()
   hourly_precipitation = hourly.Variables(4).ValuesAsNumpy()
   hourly_rain = hourly.Variables(5).ValuesAsNumpy()
   hourly_snowfall = hourly.Variables(6).ValuesAsNumpy()
   hourly_snow_depth = hourly.Variables(7).ValuesAsNumpy()
   hourly_weather_code = hourly.Variables(8).ValuesAsNumpy()
   hourly_pressure_msl = hourly.Variables(9).ValuesAsNumpy()
   hourly_surface_pressure = hourly.Variables(10).ValuesAsNumpy()
   hourly_cloud_cover = hourly.Variables(11).ValuesAsNumpy()
   hourly_cloud_cover_low = hourly.Variables(12).ValuesAsNumpy()
   hourly_cloud_cover_mid = hourly.Variables(13).ValuesAsNumpy()
   hourly_cloud_cover_high = hourly.Variables(14).ValuesAsNumpy()
   hourly_et0_fao_evapotranspiration = hourly.Variables(15).ValuesAsNumpy()
   hourly_vapour_pressure_deficit = hourly.Variables(16).ValuesAsNumpy()
   hourly_wind_speed_10m = hourly.Variables(17).ValuesAsNumpy()
   hourly_wind_speed_100m = hourly.Variables(18).ValuesAsNumpy()
   hourly_wind_direction_10m = hourly.Variables(19).ValuesAsNumpy()
   hourly_wind_direction_100m = hourly.Variables(20).ValuesAsNumpy()
   hourly_wind_gusts_10m = hourly.Variables(21).ValuesAsNumpy()
   hourly_soil_temperature_0_to_7cm = hourly.Variables(22).ValuesAsNumpy()
   hourly_soil_temperature_7_to_28cm = hourly.Variables(23).ValuesAsNumpy()
   hourly_soil_temperature_28_to_100cm = hourly.Variables(24).ValuesAsNumpy()
   hourly_soil_temperature_100_to_255cm = hourly.Variables(25).ValuesAsNumpy()
   hourly_soil_moisture_0_to_7cm = hourly.Variables(26).ValuesAsNumpy()
   hourly_soil_moisture_7_to_28cm = hourly.Variables(27).ValuesAsNumpy()
   hourly_soil_moisture_28_to_100cm = hourly.Variables(28).ValuesAsNumpy()
   hourly_soil_moisture_100_to_255cm = hourly.Variables(29).ValuesAsNumpy()
  
   hourly_data = {"date": pd.date_range(
     start = pd.to_datetime(hourly.Time(), unit = "s", utc = True),
     end = pd.to_datetime(hourly.TimeEnd(), unit = "s", utc = True),
     freq = pd.Timedelta(seconds = hourly.Interval()),
     inclusive = "left"
   )}
   hourly_data["latitude"] = row["latitude"]
   hourly_data["longitude"] = row["longitude"]
   hourly_data["temperature_2m"] = hourly_temperature_2m
   hourly_data["relative_humidity_2m"] = hourly_relative_humidity_2m
   hourly_data["dew_point_2m"] = hourly_dew_point_2m
   hourly_data["apparent_temperature"] = hourly_apparent_temperature
   hourly_data["precipitation"] = hourly_precipitation
   hourly_data["rain"] = hourly_rain
   hourly_data["snowfall"] = hourly_snowfall
   hourly_data["snow_depth"] = hourly_snow_depth
   hourly_data["weather_code"] = hourly_weather_code
   hourly_data["pressure_msl"] = hourly_pressure_msl
   hourly_data["surface_pressure"] = hourly_surface_pressure
   hourly_data["cloud_cover"] = hourly_cloud_cover
   hourly_data["cloud_cover_low"] = hourly_cloud_cover_low
   hourly_data["cloud_cover_mid"] = hourly_cloud_cover_mid
   hourly_data["cloud_cover_high"] = hourly_cloud_cover_high
   hourly_data["et0_fao_evapotranspiration"] = hourly_et0_fao_evapotranspiration
   hourly_data["vapour_pressure_deficit"] = hourly_vapour_pressure_deficit
   hourly_data["wind_speed_10m"] = hourly_wind_speed_10m
   hourly_data["wind_speed_100m"] = hourly_wind_speed_100m
   hourly_data["wind_direction_10m"] = hourly_wind_direction_10m
   hourly_data["wind_direction_100m"] = hourly_wind_direction_100m
   hourly_data["wind_gusts_10m"] = hourly_wind_gusts_10m
   hourly_data["soil_temperature_0_to_7cm"] = hourly_soil_temperature_0_to_7cm
   hourly_data["soil_temperature_7_to_28cm"] = hourly_soil_temperature_7_to_28cm
   hourly_data["soil_temperature_28_to_100cm"] = hourly_soil_temperature_28_to_100cm
   hourly_data["soil_temperature_100_to_255cm"] = hourly_soil_temperature_100_to_255cm
   hourly_data["soil_moisture_0_to_7cm"] = hourly_soil_moisture_0_to_7cm
   hourly_data["soil_moisture_7_to_28cm"] = hourly_soil_moisture_7_to_28cm
   hourly_data["soil_moisture_28_to_100cm"] = hourly_soil_moisture_28_to_100cm
   hourly_data["soil_moisture_100_to_255cm"] = hourly_soil_moisture_100_to_255cm
   hourly_dataframe=pd.concat([hourly_dataframe,pd.DataFrame(data = hourly_data)])
   time.sleep(1)

#save into csv
hourly_dataframe.to_csv('long_lat_weather_data.csv')





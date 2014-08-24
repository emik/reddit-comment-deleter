@echo off
set /p username=Enter username:%=%
set /p password=Enter password:%=%
set /p deleteDistanceDays=Enter the number of days in the past before which you wish to delete reddit comments:%=%
@echo username=%username% > config.ini
@echo password=%password% >> config.ini
@echo deleteDistanceDays=%deleteDistanceDays% >> config.ini
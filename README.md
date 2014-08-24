reddit-comment-deleter
======================
Allows routine reddit comment deletion using node.js. Just fill in the basic config details and set your system to run `node app.js` within the root folder. app.js will gather all of your comments via the reddit API and delete them if they were posted more than X days ago (where X is the number of days you have defined in the config).

Windows users can run Setup.bat to set up their reddit details and the number of days in the past to delete from. Be aware than passwords are stored as plain text in the config.ini so keep it safe!

If you do not wish to use the Setup.bat (or are not a Windows user) create a config.ini as follows:

```
username = yourusername
password = yourpassword
deleteDistanceDays = numberofdays
```
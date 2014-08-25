var request = require('request')
  , ini     = require('ini')
  , fs 	    = require('fs')
  , Promise = require("bluebird");

// parse user details and generate deletion date
var config = ini.parse(fs.readFileSync('./config.ini', 'utf-8'));
var deleteDistanceDays = config.deleteDistanceDays;
var deleteBeforeDate = new Date(new Date().setDate(new Date().getDate()-deleteDistanceDays));
var deleteBeforeTimestamp = Math.round(deleteBeforeDate.getTime() / 1000);

var commentsToDelete = [];
var comments = [];

function Reddit(config){
	this.username = config.username;
	this.password = config.password;
	this.comments = this.commentData = [];
	this.userAgent = 'emik\'s comment deletion bot run by ' + config.username;
}
Reddit.prototype.login = function(){
	var redditObject = this;
	return new Promise(function(resolve, reject){
		request.post(
			{
				url: 'https://ssl.reddit.com/api/login',
				form: {
					user: redditObject.username,
					passwd: redditObject.password,
					api_type: 'json',
				},
				headers:{
					'User-Agent': redditObject.userAgent,
				},
				json: true
			},
			function (error, response, body) {
				if (!error && response.statusCode == 200) {
					redditObject.cookie = body.json.data.cookie;
					redditObject.modhash = body.json.data.modhash;
					resolve();
				}
				reject(Error('Failed to log in'));
			}
		);
	});
};
Reddit.prototype.getUserComments = function(){
	var redditObject = this;
	var i = 0;
	var completeFunc;
	p = new Promise(function(resolve, reject){
		completeFunc = resolve;
	});
	function getRecursiveComments(after){
		if(typeof after !== 'undefined'){
			after = '&after='+after;
		}else{
			after = '';
		}
		console.log('https://ssl.reddit.com/user/'+redditObject.username+'/comments.json?limit=100'+after);
		request.get(
			{
				url: 'https://ssl.reddit.com/user/'+redditObject.username+'/comments.json?limit=100&count=100'+after,
				headers:{
					'User-Agent': redditObject.userAgent,
					'X-Modhash': redditObject.modhash,
					'Cookie' : 'reddit_session='+redditObject.cookie
				},
				json: true
			},
			function (error, response, body) {
				if (!error && response.statusCode == 200) {
					i++;
					var comments = [];
					// console.log(body.data.children.length);
					body.data.children.forEach(function(comment, index, array){
						comments.push(comment.data);
					});
					if(comments.length > 0){
						// possibly check if comment isn't already in array
						comments.forEach(function(comment, index, array){
							redditObject.commentData.push(comment);
						});
						getRecursiveComments(comments[comments.length - 1].name);
					}else{
						completeFunc(redditObject.commentData);
					}
				}else{
					Error('Failed to get comments');
				}
			}
		);
	}
	getRecursiveComments();
	return p;
};

// process comment json data into comment objects
Reddit.prototype.setComments = function(){
	var redditObject = this;
	var commentArray = [];
	return new Promise(function(resolve, reject){
		redditObject.commentData.forEach(function(comment, index, array){
			var commentObject = new Comment(comment);
			commentArray.push(commentObject);
		});
		redditObject.comments = commentArray;
		resolve();
	});
};


function Comment(commentData){
	// copy comment data to build comment object
	for (var key in commentData) {
		this[key] = commentData[key];
	}
}
Comment.prototype.logDetails = function(){
	console.log('Details:');
	console.log(this.name);
	console.log(this.created);
	console.log(this.body);
	console.log('\n');
};
Comment.prototype.isOlderThan = function(timestamp){
	if(this.created < timestamp){
		return true;
	}
	return false;
};
Comment.prototype.delete = function(redditObject){
	var commentObject = this;
	return new Promise(function(resolve, reject){
		request.post(
			'https://ssl.reddit.com/api/del',
			{
				form: {
					id: commentObject.name,
					user: redditObject.username,
					passwd: redditObject.password
				},
				headers: {
					'User-Agent': redditObject.userAgent,
					'X-Modhash': redditObject.modhash,
					'Cookie' : 'reddit_session='+redditObject.cookie
				}
			}, function(error, response, body){
				resolve();
			}
		);
	});
};


var reddit = new Reddit(config);
reddit.login().then(function(){
	return reddit.getUserComments();
}).then(function(data){
	return reddit.setComments(data);
}).then(function(data){
	reddit.comments.forEach(function(comment, index){
		if(comment.isOlderThan(deleteBeforeTimestamp)){
			commentsToDelete.push(comment);
		}
	});
	console.log('end commentsadded.');
}).then(function(data){
	commentsToDelete.forEach(function(comment){
		comment.logDetails();
		comment.delete(reddit);
	});
	console.log('end.');
});
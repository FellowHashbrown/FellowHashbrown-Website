const express = require('express');
const partials = require('express-partials');
const ejs = require('ejs');
const compression = require('compression');
const spdy = require('spdy');
var path = require('path');
const fs = require('fs');
const wrapAsync = require('express-async');
const axios = require('axios');
const { auth, requiresAuth } = require("express-openid-connect");
const cookieParser = require("cookie-parser");

// Setup app
const app = express();
app.set("trust proxy", true);
app.use(compression({ filter: shouldCompress, level: 9 }));
app.engine('.html', ejs.render);
app.set('views', __dirname + '/views');
app.set("view engine", "html");
app.disable('x-powered-by');
app.use(express.static(__dirname));
app.use(cookieParser());
app.use(express.json());

function shouldCompress(req, res) {
	if (req.headers['x-no-compression']) {
		// don't compress responses with this request header
		return false
	}
	return true
}

// Get a list of pages and subpages in specific directories
function getPages(baseDir = './views', endpoint = '') {
    var validDirectories = ['/coding', '/twitch']
    var validPages = []
    for (const dirFile of fs.readdirSync(baseDir)) {
        if (dirFile.indexOf('.') == -1) { // Only worry about directories, not files
            for (const validDir of validDirectories) {
                if ((endpoint + '/' + dirFile).startsWith(validDir)) {
                    validPages.push(endpoint + '/' + dirFile)
                    for (page of getPages(baseDir + '/' + dirFile, endpoint + '/' + dirFile)) {
                        validPages.push(page);
                    }
                }
            }
        }
    }
    if (endpoint == '')
        validPages.push('/')
    console.log(validPages)
    return validPages
}

// Create the downloads page json by retrieving it from the database
//  which uses https://api.fellowhashbrown.com
var downloadsJson = {};
axios.get("https://api.fellowhashbrown.com/redirects", {
    headers: {
        "X-FELLOW-KEY": process.env.X_FELLOW_KEY
    }}).then(function (response) {
        for (project in response.data.value) {
            if (project !== "get2054") {
                downloadsJson[project] = response.data.value[project];
            }
        }
    }).catch(function (error) {
        console.log(error);
    });

var omegaPsiJson = {};
axios.get("https://api.fellowhashbrown.com/omegapsi")
    .then(function (response) {
        omegaPsiJson = response.data;
    }).catch(function (error) {
        console.log(error);
    })

// Use the getPages() function to attach a GET request to all the pages
//  get the JSON object of the API requests and responses to use for the API page
app.get("/discord", function(req, res) {
    res.redirect("https://discord.gg/x8n4bgBUVm");
});
app.get("/youtube", function(req, res) {
    res.redirect("https://www.youtube.com/channel/UCN4XAg6Cb5fG8Rl7jUoY4ug");
});
app.get("/merch", function(req, res) {
    res.redirect("https://store.streamelements.com/fellowhashbrown");
});
app.get("/throne", function(req, res) {
    res.redirect("https://jointhrone.com/u/FellowHashbrown");
})
app.get("/twitch/mod", function(req, res) {
    if (req.cookies.discordUN === undefined) {
        // No code, ask for discord oauth
        if (req.query.code === undefined && req.query.error == undefined) {

            // redirect to oauth for discord
            res.redirect(`https://discord.com/api/oauth2/authorize?client_id=${process.env.CLIENT_ID}&redirect_uri=https%3A%2F%2Ffellowhashbrown.com%2Ftwitch%2Fmod&response_type=code&scope=identify`)
        }

        // There is code, oauth completed successfully
        else if (req.query.error === undefined) {

            // Make POST request to get access token
            const params = new URLSearchParams();
            params.append("client_id", process.env.CLIENT_ID);
            params.append("client_secret", process.env.CLIENT_SECRET);
            params.append("grant_type", "authorization_code");
            params.append("code", req.query.code);
            params.append("redirect_uri", process.env.REDIRECT_URI);
            params.append("scope", "identify");
            const headers = {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            };
            axios.post("https://discord.com/api/oauth2/token", params,
                { headers: headers
            }).then(response => { // The token request was successful! now get the username and discriminator
                const data = response.data;
                axios.get("https://discord.com/api/users/@me", 
                    { headers: {'Authorization': `${data.token_type} ${data.access_token}`}
                }).then(response => { // The @me request was successful
                    res.cookie("discordUN", response.data.username);
                    res.cookie("discordDI", response.data.discriminator);
                    res.cookie("discordID", response.data.id);
                    res.redirect("/twitch/mod");

                }).catch(error => { // The @me request was NOT successful
                    // TODO the @me GET request error
                    res.send("oof");
                })
                
            }).catch(error => { // The token request failed! 
                console.log(error.message);
                console.log(error.response)
                res.send("oof");
            })

        } else {
            res.redirect("/twitch");
        }
    } else {
        var pageJson = JSON.parse(fs.readFileSync('./views/twitch/mod/page.json'));
        pageJson.page = "mod";
        ejs.renderFile("./views/twitch/mod/index.html",
            {
                'page': pageJson,
                'breadcrumbs': `<a href="${'/'}" class="link"><code>home</code></a> \< <a href="${'/twitch'}" class="link"><code>twitch</code></a> \< <code class="code-string">mod</code>`,
                'closed': true
            },
            function (err, str) {
                res.send(str);
            }
        )
    }
});
app.post("/twitch/mod/submit", function(req, res) {
    if (req.hostname == "www.fellowhashbrown.com") {
        axios({
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            data: JSON.stringify(req.body),
            url: process.env.WEBHOOK_URL
        }).then(success => {
            res.clearCookie("discordUN");
            res.clearCookie("discordDI");
            res.clearCookie("discordID");
            res.status(200).send("success");
        }).catch(error => {
            res.status(400).send(error);
        });
    } else {
        res.status(403).send("You can't do that fam");
    }
});
getPages().forEach(function(page) {
    app.get(page, function(req, res) {
        var pageJson = JSON.parse(fs.readFileSync('./views' + page + '/page.json'))

        // Get a split version of the page, setting the first page to home, always
        //  also set the endpoint of the page
        var pageSplit = page.split('/')
        var pageBreadcrumbs = page.split('/')
        pageSplit[0] = 'home'
        pageJson.endpoint = page
        pageJson.page = (page == '/')? 'home': pageSplit[pageSplit.length - 1]

        // Only add breadcrumbs if the page is not the homepage and if 
        //  the page is not a main page
        breadcrumbs = ""
        if (page != '/') {

            // Add the breadcrumbs
            var breadcrumbs = "";
            for (let i = 0; i < pageSplit.length; i++) {
                let pageCrumb = pageSplit[i];
                pageCrumb = pageCrumb.charAt(0).toUpperCase() + pageCrumb.substring(1);
                pageLoc = pageBreadcrumbs.slice(0, i + 1).join('/')
                if (pageLoc.length == 0) {
                    pageLoc = '/'
                }
                if (i < pageSplit.length - 1) {
                    breadcrumbs += `<a href="${pageLoc}" class="link"><code>${pageCrumb}</code></a> \< `
                }
            }

            // Insert the current page in the parentheses as a string
            breadcrumbs += `<code class="code-string">${pageSplit[pageSplit.length - 1]}</code>`
        }
        ejs.renderFile(
            "./views" + page + "/index.html", 
            { 
                'page': pageJson,
                "projects": downloadsJson,
                "omegaPsiUpdates": omegaPsiJson,
                "breadcrumbs": breadcrumbs
            }, 
            function(err, str) {
                res.send(str)
            }
        )
    })
});

app.listen(8080, () => {
    console.log("server started")
});
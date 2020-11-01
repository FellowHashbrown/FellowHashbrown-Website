const express = require('express');
const partials = require('express-partials');
const ejs = require('ejs');
const compression = require('compression');
const spdy = require('spdy');
var path = require('path');
const fs = require('fs');
const wrapAsync = require('express-async');
const axios = require('axios');

// Setup app
const app = express()
app.use(compression({ filter: shouldCompress, level: 9 }))
app.engine('.html', ejs.render);
app.set('views', __dirname + '/views')
app.set("view engine", "html")
app.disable('x-powered-by')
app.use(express.static(__dirname))

function shouldCompress(req, res) {
	if (req.headers['x-no-compression']) {
		// don't compress responses with this request header
		return false
	}
	return true
}

// Get a list of pages and subpages in specific directories
function getPages(baseDir = './views', endpoint = '') {
    var validDirectories = ['/downloads', '/projects']
    var validPages = []
    for (const dirFile of fs.readdirSync(baseDir)) {
        if (dirFile.indexOf('.') == -1) {
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
                    breadcrumbs += `<code class="code-new">new</code> <a href="${pageLoc}" class="link"><code>${pageCrumb}</code></a>(`
                }
            }

            // Insert the current page in the parentheses as a string
            breadcrumbs += `<code class="code-string">"${pageSplit[pageSplit.length - 1]}"</code>`
            for (let i = 0; i < pageSplit.length - 1; i++) {
                breadcrumbs += ')'
            }
            breadcrumbs += ";"
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
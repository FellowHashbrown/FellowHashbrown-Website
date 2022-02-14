function getCookie(cname) {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for(let i = 0; i <ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

function getBasicInfo() {
    var form = document.getElementById("basic_info_form");
    return { discovery: form.discoveryText.value,
             purpose: form.purposeText.value };
}

function getDiscordServer() {
    var formActivity = document.getElementById("discord_server_form_activity");
    var formImprovements = document.getElementById("discord_server_form_improvements");
    var formAdmin = document.getElementById("discord_server_form_admin");
    return { activity: formActivity.activity.value, 
             improvements: formImprovements.improvement.value, 
             admin: formAdmin.admin.value };
}

function getTwitchStream() {
    var formExperience = document.getElementById("twitch_form_experience");
    var formTuesday = document.getElementById("twitch_form_availability_tuesday");
    var formWednesday = document.getElementById("twitch_form_availability_wednesday");
    var formThursday = document.getElementById("twitch_form_availability_thursday");

    var experience = formExperience.mod.value;
    var otherStreamers = formExperience.previous_mods.value;

    return { experience: { type: experience, other: otherStreamers },
             tuesday: formTuesday.tuesday.value,
             wednesday: formWednesday.wednesday.value,
             thursday: formThursday.thursday.value };
}

function getHypotheticals() {
    var formHypotheticals = document.getElementById("hypotheticals_form");

    return { sensitive: formHypotheticals.sensitive.value,
             nsfw: formHypotheticals.nsfw.value,
             vc: formHypotheticals.vc.value,
             charlie: formHypotheticals.charlie.value,
             llamas: formHypotheticals.llamas.value,
             favoriteTikTok: formHypotheticals.favorite_tik_tok.value };
}

function createWebhookJSON() {
    var basicInfo = getBasicInfo();
    var discordServer = getDiscordServer();
    var twitchStream = getTwitchStream();
    var hypotheticals = getHypotheticals();

    return {
        "username": `${getCookie("discordUN")}#${getCookie("discordDI")}`,
        "content": null,
        "embeds": [
            {
                "color": null,
                "fields": [
                    {
                        "name": "Basic Info",
                        "value": `*How did you find me?* : ${basicInfo.discovery}\n*Why do you want to mod for me?* : ${basicInfo.purpose}`
                    },
                    {
                        "name": "Discord Server",
                        "value": `*How active are you in my discord server?* : ${discordServer.activity}\n*Do you see any place for improvement on my discord server?* : ${discordServer.improvements}\n*Are you good with bot configurations, permissions, etc.?* : ${discordServer.admin}`
                    },
                    {
                        "name": "Twitch Stream",
                        "value": `*Have you done any twitch modding for another streamer? Current or past counts!*: ${ (twitchStream.experience.type == "none") ? "none" : ("yes" + twitchStream.experience.other)}\n**Tuesday Availability**: ${twitchStream.tuesday}\n**Wednesday Availability**: ${twitchStream.wednesday}\n**Thursday Availability**: ${twitchStream.thursday}`
                    }
                ]
            },
            {
                "title": "Hypothetical Questions",
                "description": "_ _",
                "color": null,
                "fields": [
                    {
                        "name": "Let's say someone sent a message in twitch or discord that revolves around a sensitive subject. What would you do?",
                        "value": hypotheticals.sensitive
                    },
                    {
                        "name": "Someone sends an NSFW meme in the discord server. How do you handle it?",
                        "value": hypotheticals.nsfw
                    },
                    {
                        "name": "Someone in VC is saying nasty stuff. What do you do next?",
                        "value": hypotheticals.vc
                    },
                    {
                        "name": "Put a banana in ... ?",
                        "value": hypotheticals.charlie
                    },
                    {
                        "name": "My stomach has the rumblies that ... ?",
                        "value": hypotheticals.llamas
                    },
                    {
                        "name": "Paste the link to your favorite tik tok (if it violates server rules, i swear)",
                        "value": hypotheticals.favoriteTikTok
                    }
                ]
            }
        ]
    };
}

function submitModForm() {
    var webhookJSON = createWebhookJSON();
    fetch("https://www.fellowhashbrown.com/twitch/mod/submit", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(webhookJSON)
    }).then(response => {
        if (!response.ok) {
            throw Error(response.statusText);
        }
    }).then(data => {
        Swal.fire({
            icon: "success",
            title: "perfect!",
            text: "your mod application has been submitted! my mods and i will look at this, trust",
            customClass: {
                container: 'swal-container',
                popup: 'swal-popup',
                content: 'swal-content',
                title: 'swal-title',
                confirmButton: 'swal-confirm'
            }
        }).then((result) => {
            window.location.href = "/twitch";
        });
    }).catch(error => {
        Swal.fire({
            icon: 'error',
            title: "OOF",
            text: "you're missing some stuff. make sure you filled everything out!",
            customClass: {
                container: 'swal-container',
                popup: 'swal-popup',
                content: 'swal-content',
                title: 'swal-title',
                confirmButton: 'swal-confirm'
            }
        });
    });

}
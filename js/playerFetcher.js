const fetch = require('node-fetch')
const schedule = require('node-schedule');

var keyCount;
var keyMax;

const addRequest = () => {
    if (keyCount != undefined && keyMax != undefined) {
        keyCount++
        document.getElementById("creditFooter").innerHTML = `v${vers || [UNKNOWN]} | Requests: ${keyCount}/${keyMax}<br>${credits}`
    }
}

const getKey = async (key) => {
    return new Promise(async resolve => {
        const data = await fetch(`https://api.hypixel.net/key?key=${key}`)
        try { var body = await data.json() } catch { resolve({ valid: false }) }
        if (body.success) resolve({ valid: true, max: body.record.limit })
        else resolve({ valid: false })
    })
}

async function getuuid(ign) {
    try {
        const response = await fetch(`https://playerdb.co/api/player/minecraft/${ign}`);
        const data = await response.json();
        return (data.data.player.raw_id);
    } catch {
        return "nickedplayer"
    }
}

const getPlayer = async (user) => {
    addRequest()
    if (keyCount >= keyMax + 5) return { throttle: true, username: user }
    return new Promise(async resolve => {
        const requestTime = Date.now()
        const data = await fetch(`https://api.hypixel.net/player?key=${readFromStorage("api")}&uuid=${await getuuid(user)}`)
        try { var body = await data.json() } catch { resolve({ outage: true, username: user }) }
        if (body.throttle) resolve({ throttle: true, username: user })
        if (body.cause == "Invalid API key") resolve({ invalid: true, username: user })
        if (body.success == false || body.player == null || !body.player.displayname) resolve({ exists: false, username: user })
        else {
            var player = body.player
            var arcade = player.stats ? player.stats.Arcade || {} : {}
            var rank = getRank(player)
            var plusColor = getPlusColor(rank, player.rankPlusColor)
            var formattedRank = getFormattedRank(rank, plusColor.mc)
            var origUsername = user

            resolve({
                uuid: player.uuid,
                username: player.displayname,
                inputtedUsername: origUsername,
                displayName: `${formattedRank}${player.displayname}`,
                chat: player.channel,

                rank: rank,
                plus: plusColor,

                stats: {
                    Arcade: {
                        wins: arcade.wins_halloween_simulator || 0,
                        collected: arcade.candy_found_halloween_simulator || 0,
                        ppw: Math.round(((arcade.candy_found_halloween_simulator / (arcade.wins_halloween_simulator || 1)) || 0) * 10) / 10,
                        index: Math.round(((arcade.wins_halloween_simulator || 0.1) * Math.sqrt((arcade.candy_found_halloween_simulator || 0))))/10
                    }
                },
                requestedAt: requestTime
            })
        }
    })
}

const getGuild = async (uuid) => {
    addRequest()
    if (keyCount >= keyMax + 5) return { throttle: true }
    return new Promise(async resolve => {
        const requestTime = Date.now()
        const data = await fetch(`https://api.hypixel.net/guild?key=${readFromStorage("api")}&player=${uuid}`)
        try { var body = await data.json() } catch { resolve({ outage: true }) }
        if (body.throttle) resolve({ throttle: true })
        if (body.cause == "Invalid API key") resolve({ invalid: true })
        if (body.success == false || body.guild == null || !body.guild.name) resolve({ exists: false })
        else {
            const getGuildTagColor = color => ({ "DARK_AQUA": { hex: "#00AAAA", mc: "§3" }, "DARK_GREEN": { hex: "#00AA00", mc: "§2" }, "YELLOW": { hex: "#FFFF55", mc: "§e" }, "GOLD": { hex: "#FFAA00", mc: "§6" } }[color] || { hex: "#AAAAAA", mc: "§7" })

            body.guild.mcColor = getGuildTagColor(body.guild.tagColor);

            resolve(body.guild)
        }
    })
}

/* Randomly assign which order the credits are in on run */
var authors = ["imconnorngl", "videogameking", "ugcodrr"]
authors = authors.sort(() => .5 - Math.random());
var credits = `Made by Georgesatchy x Statsify Inc.`

/* API Counter */
var api = readFromStorage("api")
var vers = readFromStorage("version")

if (api) {
    
    const form =  document.getElementById("apiKeyField");
    
    document.getElementById("apiKeyField").value = api

    getKey(api).then(keyStatus => {
        if (keyStatus.valid == true) {
            keyCount = 0
            keyMax = keyStatus.max || 120
            
            schedule.scheduleJob('1 * * * * *', function() {
                keyCount = 0
                //player.throttle
                document.getElementById("creditFooter").innerHTML = `v${vers || "0.0.0"} | Requests: ${keyCount}/${keyMax}<br>${credits}`
            });

            document.getElementById("creditFooter").innerHTML = `v${vers || "0.0.0"} | Requests: ${keyCount}/${keyMax}<br>${credits}`
        }
    })
} else {
    const form =  document.getElementById("apiKeyField");
    document.getElementById("creditFooter").innerHTML = `v${vers || "0.0.0"} | ${credits}`
}
let cachedPlayers = {}
let currentPlayers = {}
let cachedGuilds = new Map()

const addPlayer = async player => {
  if (player in currentPlayers) return;

  if (player in cachedPlayers) {
    currentPlayers[player] = cachedPlayers[player]
  } else {
    let playerObj = await getPlayer(player)
    if (playerObj.exists == false) playerObj["username"] = player
    else if (readFromStorage("guildEnabled")) {
      let guild;
      if (cachedGuilds.get(playerObj.uuid)) guild = cachedGuilds.get(player.uuid)
      else if (!playerObj.outage || !playerObj.throttle || !playerObj.invalid) guild = await getGuild(playerObj.uuid);

      if (guild.members) guild.members.forEach(member => cachedGuilds.set(member.uuid. guild))
      playerObj.guild = guild;
    }

    cachedPlayers[player] = playerObj
    currentPlayers[player] = playerObj
    
  }
  tableUpdater()
}

const resetPlayers = async () => {
  currentPlayers = {}
  tableUpdater()
}

const resetCache = async () => {
  cachedPlayers = {}
  tableUpdater()
}

const removePlayer = async player => {
  if (!player in currentPlayers) return;
  delete currentPlayers[player]
  tableUpdater()
}

const removePlayers = async players => {
  players.forEach(player => {
    if (!player in currentPlayers) return;
    delete currentPlayers[player]
    delete cachedPlayers[player];
  })

  tableUpdater()
}

//

let erroredPlayers = [];
schedule.scheduleJob('1 * * * * *', function() {
  if(erroredPlayers.length) removePlayers(erroredPlayers);
  erroredPlayers = [];
});

//

const makeTooltip = (index, text, html) =>  `<div class="tooltip">${text}<span class="tooltiptext" style="bottom: ${-1600 + (index*100)}%">${html}</span></div>`

const getThreatColor = index => {
  index = Math.ceil(index);

  if (index <= 0.1) return `§7`
  else if (index <= 30) return `§a`
  else if (index <= 120) return `§2`
  else if (index <= 750) return `§e`
  else if (index <= 3000) return `§6`
  else if (index <= 15000) return `§c`
  else return `§4`
}

let timeOut;

const tableUpdater = async () => {    
  let mode = readFromStorage("mode") || "overall"
  showWindow()

  clearTimeout(timeOut);
  timeOut = setTimeout(() => {
    let hideMode = readFromStorage("autoHide")
    if(hideMode == undefined || hideMode == true) hideWindow()
  }, 20000)

  const table = document.getElementById("playerTable");

  let rowCount = table.rows.length;
  for (let i = 1; i < rowCount; i++) table.deleteRow(1);

  let objectValues = Object.values(currentPlayers)

  objectValues = objectValues.sort((a, b) => {
    let aWins = (a.stats ? a.stats.Arcade : {}).wins != undefined ? (a.stats ? a.stats.Arcade : {}).wins : Infinity
    let bWins = (b.stats ? b.stats.Arcade : {}).wins != undefined ? (b.stats ? b.stats.Arcade : {}).wins : Infinity

    let aCollected = (a.stats ? a.stats.Arcade : {}).collected != undefined ? (a.stats ? a.stats.Arcade : {}).collected : Infinity
    let bCollected = (b.stats ? b.stats.Arcade : {}).collected != undefined ? (b.stats ? b.stats.Arcade : {}).collected : Infinity

    let aPPW = (a.stats ? a.stats.Arcade : {}).ppw || 0
    let bPPW = (b.stats ? b.stats.Arcade : {}).ppw || 0

    a.threatIndex = (aWins * Math.sqrt(aCollected))/10
    b.threatIndex = (bWins * Math.sqrt(bCollected))/10

    let sortMode = readFromStorage("sort") || "threat"

    return b.threatIndex - a.threatIndex
  })

  for (const player of objectValues) {
    const index = objectValues.indexOf(player);
    let row = table.insertRow(index + 1);

    let head = row.insertCell(0);
    let name = row.insertCell(1);
    let tag = row.insertCell(2);
    let wins = row.insertCell(3);
    let collected = row.insertCell(4);
    let ppw = row.insertCell(5);
    let indexDisplay = row.insertCell(6);
    
    let partyMembers = {};

    if (player.exists == false) {
      name.innerHTML = mcColorParser(`§7${player.username}`)
      tag.innerHTML = mcColorParser(`§4NICKED`)
    }
    else if (player.outage) { name.innerHTML = mcColorParser(`§8${player.username || "ERROR"} - §cHypixel API Outage`); erroredPlayers.push(player.username); }
    else if (player.throttle) { name.innerHTML = mcColorParser(`§8${player.username || "ERROR"} - §cKey Throttle`); erroredPlayers.push(player.username); }
    else if (player.invalid) { name.innerHTML = mcColorParser(`§8${player.username || "ERROR"} - §cInvalid API Key`); erroredPlayers.push(player.username); }
    else {
      if((["e3b17fc96e5b437a9c88a84dc6adaa39", "618a96fec8b0493fa89427891049550b", "20aa2cf67b7443a093b5f3666c160f5f"]).includes(player.uuid)) tag.innerHTML = mcColorParser(`§3DEV`)
      else if (objectValues.length <= 48) {
        if(player.chat == "PARTY") tag.innerHTML = mcColorParser(`§9PARTY`);
      }


      let Wins = (player.stats ? player.stats.Arcade : {}).wins != undefined ? (player.stats ? player.stats.Arcade : {}).wins : Infinity
      let Collected = (player.stats ? player.stats.Arcade : {}).collected != undefined ? (player.stats ? player.stats.Arcade : {}).collected : Infinity
      player.threatIndex = (Wins * Math.sqrt(Collected))/10
      let threatColor = getThreatColor(player.threatIndex);
      
      head.innerHTML = `<img src="https://crafatar.com/avatars/${player.uuid}?size=16&overlay=true"; class="skull";></img>`
      name.innerHTML = `${makeTooltip(index + 1, mcColorParser(`${threatColor} ${player.displayName}${player.guild ? player.guild.tag ? ` ${player.guild.mcColor.mc}[${player.guild.tag}]` : "" : ""}`), mcColorParser(`
      ${player.displayName} ${player.guild ? player.guild.tag ? `${player.guild.mcColor.mc}[${player.guild.tag}]` : "" : ""}
      <br>
      ${player.guild ? player.guild.name ? `§7Guild: ${player.guild.mcColor.mc}${player.guild.name}<br>` : "" : ""}<br>
      ${Object.values(partyMembers).length ? ("§7Party Members:<br>§9" + Object.values(partyMembers).join("<br>") + "<br><br>") : player.chat == "PARTY" ? "§7Party: §9Chat <br><br>" : ""}
      <br>
      `))}</div>`
      wins.innerHTML = mcColorParser(`${threatColor}${player.stats.Arcade.wins.toLocaleString()}`)
      collected.innerHTML = mcColorParser(`${threatColor}${player.stats.Arcade.collected.toLocaleString()}`)
      ppw.innerHTML = mcColorParser(`${threatColor}${player.stats.Arcade.ppw}`)
      indexDisplay.innerHTML = mcColorParser(`${threatColor}${player.stats.Arcade.index}`)

      if (player.stats.Arcade.index >= 500) {
        tag.innerHTML = mcColorParser(`§6RISKY`)
      }
      if (player.stats.Arcade.index >= 5000) {
        tag.innerHTML = mcColorParser(`§4DANGER`)
      }
      if (player.username === "xGe_") {
        tag.innerHTML = mcColorParser(`§3DEV`)
      }
      if (player.username === "Kxpow") {
        tag.innerHTML = mcColorParser(`§dPRO`)
      }

      name.onmouseover = () => {
        if (readFromStorage("resizeEnabled")) {
          let window = remote.getCurrentWindow()
          let size = { x: window.getSize()[0], y: 460 }
          if (objectValues.length >= 16) size = { x: window.getSize()[0], y: 460 }
          else size = { x: window.getSize()[0], y: (450 <= Math.round(objectValues.length*25) ? Math.round(objectValues.length*25) : 450) }

          window.setSize(size.x, size.y)
        }
      }
    }
  }

  if (readFromStorage("resizeEnabled")) {
    if((document.getElementById("menu").classList.item(1) || "None") != "None") {
      let window = remote.getCurrentWindow()
      let size = { x: window.getSize()[0], y: 460 }
      if (objectValues.length >= 16) size = { x: window.getSize()[0], y: 460 }
      else size = { x: window.getSize()[0], y: 60 + Math.round(objectValues.length*25) }
  
      window.setSize(size.x, size.y)
    }
  }
}

module.exports = tableUpdater
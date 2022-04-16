const semver = require('semver');

writeToStorage("version", "1.5.8")

const getLatestReleases = async () => {
    return new Promise(async resolve => {
        const body = await fetch('https://api.github.com/repos/imconnorngl/overlay/releases/latest')
        try {
            var data = await body.json();
        } catch {
            resolve({ outage: true })
        }

        resolve(data)
    })
}
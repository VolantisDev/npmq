module.exports = {
    filterVersion: filterVersion,
    versionArray: versionArray
}

function filterVersion (input) {
    return versionArray(input)
        .map(v => (v || '0'))
        .join('.');
}

function versionArray (versionString) {
    var version = versionString.split('.')

    while (version.length < 3) {
        version.push('0')
    }

    return version
}

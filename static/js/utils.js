function formatCents(amount) {
    return Number.parseFloat(amount)
}

function formatDate(isoString) {
    date = Date.parse(isoString)
    const options = {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'}
    return new Intl.DateTimeFormat('en-US', options).format(date)
}

function formatTime(isoString) {
    const time = Date.parse(isoString)
    const options = {hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short'}
    return new Intl.DateTimeFormat('en-US', options).format(time)
}
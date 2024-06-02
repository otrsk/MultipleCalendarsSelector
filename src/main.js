'use strict'

console.log('Starting Multiple Calendars Selector...')

let calendarListsDiv
let allCalendars

function initExtension(callbackSuccess, callbackFailure) {
    // Restore saved presets, then check for further (new) calendars
    getPresetsFromStorage(
        function (presets) {
            initCalendars(presets)
            typeof callbackSuccess === 'function' && callbackSuccess()
        },
        function (err) {
            initCalendars(undefined)
            typeof callbackFailure === 'function' && callbackFailure()
        }
    )
}

async function refreshAllCalendars() {
    calendarListsDiv = jQuery("div[role='complementary']:eq(0)").children()
    const { myCalendarsDiv, otherCalendarsDiv } = await shrinkDrawerHeight()
    const myCalendarsFromDiv = findCalendarsInDiv(myCalendarsDiv)
    const otherCalendarsFromDiv = findCalendarsInDiv(otherCalendarsDiv)
    allCalendars = [...myCalendarsFromDiv, ...otherCalendarsFromDiv]
    unshrinkDrawerHeight()
    return {
        myCalendarsFromDiv: myCalendarsFromDiv,
        otherCalendarsFromDiv: otherCalendarsFromDiv,
    }
}

async function initCalendars(presets) {
    await sleep(4000)
    let { myCalendarsFromDiv, otherCalendarsFromDiv } =
        await refreshAllCalendars()
    const allCalendarsNames = namesFromCalendarJQObjects(allCalendars)

    let debugMessage =
        "Discovered calendars' hash: " + String(allCalendarsNames).hashCode()
    console.log(debugMessage)

    chrome.storage.sync.set(
        { [storageIdForAllCalendars]: allCalendarsNames },
        null
    )

    if (typeof presets === 'undefined' || Object.keys(presets).length == 0) {
        debugMessage = 'No presets found, initialising with defaults'
        console.log(debugMessage)
        let presets = {}
        presets[generateId()] = {
            name: 'Preset 1',
            calendars: namesFromCalendarJQObjects(myCalendarsFromDiv),
            orderValue: 1,
        }
        presets[generateId()] = {
            name: 'Preset 2',
            calendars: namesFromCalendarJQObjects(otherCalendarsFromDiv),
            orderValue: 2,
        }
        storePresets(presets)
    }

    debugMessage =
        'Init Calendars done with ' + allCalendars.length + ' calendars'
    console.log(debugMessage)
    return allCalendars
}

async function shrinkDrawerHeight() {
    const invisibleZeroHeightCss = {
        height: '0px',
        visibility: 'hidden',
    }

    const dateDrawer = jQuery('#drawerMiniMonthNavigator')
    dateDrawer.css(invisibleZeroHeightCss)

    const createButton = jQuery("[aria-label='Create']")
    createButton.css(invisibleZeroHeightCss)

    const createBox = dateDrawer.parent().parent().children().first()
    createBox.css(invisibleZeroHeightCss)

    const searchDrawer = jQuery('div[role="search"]')
    searchDrawer.css(invisibleZeroHeightCss)

    const myCalendarsDiv = calendarListsDiv.children().eq(1).children()
    hideCalendarDiv(myCalendarsDiv)
    const otherCalendarsDiv = calendarListsDiv.children().eq(4).children()
    hideCalendarDiv(otherCalendarsDiv)

    const calendarListButtons = jQuery("button[aria-expanded='true']")
    const myCalendarsButton = calendarListButtons[0]
    const otherCalendarsButton = calendarListButtons[1]
    myCalendarsButton.click()
    otherCalendarsButton.click()

    const drawerDelay = await getDrawerDelayFromStorageAsync()
    await sleep(drawerDelay)
    myCalendarsButton.click()
    otherCalendarsButton.click()
    await sleep(drawerDelay)

    return {
        myCalendarsDiv: myCalendarsDiv,
        otherCalendarsDiv: otherCalendarsDiv,
    }
}

function hideCalendarDiv(div) {
    div.find('div[role="presentation"]').each(function (index) {
        jQuery(this).addClass('gcpTranslationYZero')
    })
    div.addClass('gcpHeightZero')
}

function unshrinkDrawerHeight() {
    const dateDrawer = jQuery('#drawerMiniMonthNavigator')
    const createButton = jQuery("[aria-label='Create']")
    const createBox = dateDrawer.parent().parent().children().first()
    const searchDrawer = jQuery('div[role="search"]')

    dateDrawer.removeAttr('style')
    createButton.removeAttr('style')
    createBox.removeAttr('style')
    searchDrawer.removeAttr('style')

    const { myCalendarsDiv, otherCalendarsDiv } = getCalendarDivs()

    for (const calendarDiv of [myCalendarsDiv, otherCalendarsDiv]) {
        calendarDiv.find('div[role="presentation"]').each(function (index) {
            jQuery(this).removeClass('gcpTranslationYZero')
        })
        calendarDiv.removeClass('gcpHeightZero')
    }
}

function getCalendarDivs() {
    return {
        myCalendarsDiv: calendarListsDiv.children().eq(1).children(),
        otherCalendarsDiv: calendarListsDiv.children().eq(4).children(),
    }
}

function findCalendarsInDiv(div) {
    let foundCalendars = []
    div.find('span[jsslot]:not([class])').each(function (index) {
        foundCalendars.push(jQuery(this).parent().parent())
    })
    return foundCalendars
}

function getState(calendar) {
    const calendarState = calendar
        .children()
        .children()
        .children()
        .children()[0].checked
    return calendarState
}

function setState(calendar, state) {
    const calendarState = getState(calendar)
    if (calendarState !== state) {
        calendar.click()
    }
}

function setStateOnCalendars(calendars, state) {
    calendars.forEach(function (calendar) {
        setState(calendar, state)
    })
}



function main() {
    initExtension()
}

jQuery(document).ready(function () {
    main()
})

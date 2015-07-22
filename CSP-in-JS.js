/**
 * Welcome to CSP in JS!
 *
 * This is an implementation of Go-style coroutines that access a hidden,
 * shared channel for putting data into, and taking it out of, a system.
 *
 * Channels, in this case, can be a set (for unique values), an array
 * (as a stack or a queue), or even some kind of persistent data structure.
 *
 * CSP (especially in functional platforms like ClojureScript, where the
 * `core.async` library provides asynchronous, immutable data-structures)
 * typically operates through two operations:
 *
 * (1) put(x) : put x into the channel
 * (2) take() : take one item from the channel
 *
 * This implementation uses ES6 generators (and other ES6 features), which are basically functions that
 * can return more than one value, and pause after each value yielded.
 *
 * If you want a quick way to get near instantaneous feedback as you type/edit, copy the code
 * over to the Arbiter code playground, which compiles ES6 into ES5 and runs it live:
 *
 * (*) matthiasak.github.io/Arbiter/
 *
 */

// let log = (...args) => console.log(args.length ? args : args[0])

let channel = () => {
    let c = [],
        channel_closed = false,
        actors = [],
        without = (c, name, val) => c.filter((a) => a[name] !== val),
        each = (c, fn) => c.forEach(fn)

    const put = (val) => {
            if(typeof val === 'undefined') return ["park", null]
            c.unshift(val)
            return ["continue", null]
        },
        take = () => {
            let val = c.pop()
            return [ val !== undefined ? 'continue' : 'park', val ]
        },
        spawn = function(gen){
            let iter = gen(put, take)

            let actor = () => {
                let step = iter.next()
                if(step.done || channel_closed) return
                let [state, value] = step.value || ['park']
                if(state === 'park'){
                    setTimeout(() => each(without(actors, 'id', actor.id), (a) => a() ))
                } else if(state === "continue"){
                    setTimeout(actor)
                }
            }

            actor.id = Math.random()
            actors.push(actor)

            actor()
        }

    return {
        spawn,
        close: () => {
            channel_closed = true
        }
    }
}

/**
API

channel.spawn()
channel.close()
**/


let x = channel() // create new channel()

// for any value in the channel, pull it and log it
x.spawn( function* (put, take) {
    while(true){
        let val = take()
        if(val[1]) log(`-------------------taking: ${val[1]}`)
        yield // pause!
    }
})

// put each item in fibonnaci sequence, one at a time
x.spawn( function* (put, take) {
    let [x, y] = [0, 1],
        next = x+y

    for(var i = 0; i < 100; i++) {
        next = x+y
        log(`putting: ${next}`)
        yield put(next)
        yield // pause!
        x = y
        y = next
    }
})

// immediately, and every .5 seconds, put the date/time into channel
function* insertDate(p, t) { yield p(new Date); yield p() }
setInterval(() => x.spawn(insertDate), 100)
x.spawn(insertDate)

// close the channel and remove all memory references. Pow! one-line cleanup.
setTimeout(() => x.close(), 4000)
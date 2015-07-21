/* (1) use log(..) to print output (both sync and async) to the right hand side.
 * (2) use reset(..) from your own code to reset the output area.
 * (3) CMD+S to share a link to your code. */

let channel = () => {
    let c = [],
        done = false

    const putter = (val) => {
            if(typeof val === 'undefined') return ["park", null]
            c.unshift(val)
            return ["continue", null]
        },
        taker = () => {
            let val = c.pop()
            return [ val ? 'continue' : 'park', val ]
        },
        consume = function(taker_or_putter, gen){
            var iter = gen(taker_or_putter),
                actor = go(iter, iter.next())
            actor.next()
            return actor
        },
        go = function* (iter, step) {
            while (!step.done && !done) {
                let [state, value] = step.value
                step = iter.next(value)
                switch (state) {
                    case "park": yield; break;
                    case "continue": break;
                }
            }
        }

    return {
        put: function(gen){
            let actor = consume(putter, gen)
        },
        take: function(gen){
            let actor = consume(taker, gen)
        },
        close: () => {
            done = true
        }
    }
}

/**
API

channel.put()
channel.take()
channel.close()
**/

let x = channel()

x.put( function* (putter) {
    let [x, y] = [0, 1],
        next = x+y

    for(var i = 0; i < 100; i++){
        next = x+y
        yield putter(next)
        x = y
        y = next
    }
})

x.take( function* (taker) {
    while(true){
        var val = yield taker()
        log(val)
    }
})
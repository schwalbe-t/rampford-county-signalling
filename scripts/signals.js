
const SignalState = Object.freeze({
    DANGER: Symbol("danger"),
    CAUTION: Symbol("caution"),
    PREL_CAUTION: Symbol("preliminary_caution"),
    PROCEED: Symbol("proceed")
});

function signalEngine(r, zone) {
    return {
        states: new Array(zone.signals.length)
            .fill(null)
            .map(() => {
                return {
                    auto_state: SignalState.PROCEED,
                    manual_state: SignalState.PROCEED,
                    state: SignalState.PROCEED
                };
            }),

        updateStates: function() {
            
        }
    };    
}
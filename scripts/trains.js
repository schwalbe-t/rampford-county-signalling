
const TRAIN_TIME_PER_BLOCK = 5;

function trainController(r, zone) {
    let stations = {};
    for(const platform of zone.platforms) {
        if(stations[platform.name] === undefined) {
            stations[platform.name] = [];
        }
        const station = stations[platform.name];
        station[platform.platform] = false;
    }
    return {
        trains: [],
        stations,


        spawnTrain: function() {
            const scheduleI = Math.floor(Math.random() * zone.schedules.length);
            const schedule = zone.schedules[scheduleI];
            let number = `${Math.floor(Math.random() * 100)}`;
            if(number < 10) { number = `0${number}`; }
            if(number == 0) { number = `00`; }
            const headcode = `${schedule.headcode}${number}`;
            this.trains.push({
                schedule,
                section: 0,
                nextI: 1,
                lastN: schedule.sections[0].nodes[0],
                nextN: schedule.sections[0].nodes[1],
                offset: 0,
                allocation: null,
                advanceTimer: 0,
                headcode,
                lateness: 0,
                age: 0
            });
        },


        updateTrainLateness: function() {
            for(const train of this.trains) {
                train.age += r.deltaTime;
                const nextStop = train.schedule.sections
                    .slice(train.section)
                    .find(s => s.type === "platform");
                if(!nextStop) { continue; }
                train.lateness = train.age - nextStop.departure * 60;
            }
        },


        attemptAllocation: function(train) {
            const stops = train.schedule.sections
                .slice(train.section)
                .filter(s => s.type === "platform");
            if(stops.length === 0) { return; }
            const stationName = stops[0].station;
            const possiblePlatforms = [];
            for(const stop of stops) {
                if(stop.station !== stationName) { break; }
                possiblePlatforms.push(stop.platform);
            }
            const station = this.stations[stationName];
            for(let platform = 0; platform < station.length; platform += 1) {
                if(station[platform] !== false) { continue; } // platform is taken
                if(!possiblePlatforms.includes(platform)) { continue; }
                station[platform] = true;
                train.allocation = {
                    station: stationName,
                    platform: platform
                };
            }
        },

        deallocate: function(train) {
            const station = this.stations[train.allocation.station];
            station[train.allocation.platform] = true;
            train.allocation = null;
        },


        nextNodesOf: function(train) {
            const nodes = [];
            let lastNode = train.lastN;
            for(
                let sectionI = train.section; 
                sectionI < train.schedule.sections.length; 
                sectionI += 1
            ) {
                const section = train.schedule.sections[sectionI];
                if(section.type === "platform" && sectionI !== train.section) {
                    if(train.allocation === null) { break; }
                    if(train.allocation.station !== section.station) { break; }
                    if(train.allocation.platform !== section.platform) { continue; }
                }
                let nodeI = sectionI === train.section? train.nextI : 0;
                for(; nodeI < section.nodes.length; nodeI += 1) {
                    const next = section.nodes[nodeI];
                    nodes.push([lastNode, next, sectionI, nodeI]);
                    lastNode = next;
                }
            }
            return nodes;
        },

        nextPoints: function(train) {
            let result = [];
            for(const step of this.nextNodesOf(train)) {
                const [first, second, section, secNodeI] = step;
                const isTrainNode = section === train.section 
                    && second === train.nextN;
                const minOffset = isTrainNode? train.offset : 0;
                const foundSignals = zone.signals
                    .map((s, i) => { return { s, i }; })
                    .filter(e => e.s.offset > minOffset
                        && e.s.first === first && e.s.second == second
                    )
                    .sort((a, b) => a.s.offset - b.s.offset)
                    .map(e => { return {
                        type: "signal",
                        signalI: e.i,
                        section: section,
                        nextI: secNodeI,
                        lastN: first,
                        nextN: second,
                        offset: e.s.offset
                    } });
                result.push(...foundSignals);
                const foundPlatforms = zone.platforms
                    .map((p, i) => { return { p, i }; })
                    .filter(e => e.p.second === first && e.p.first == second)
                    .map(e => { return {
                        type: "platform",
                        platformI: e.i,
                        section: section,
                        nextI: secNodeI,
                        lastN: first,
                        nextN: second,
                        offset: 0.5
                    } });
                result.push(...foundPlatforms);
            }
            if(result.length === 0) {
                throw `Unable to find next signal for train [${train.headcode}]!`;
            }
            return result;
        },

        proceedToPoint: function(train, point) {
            if(train.section !== point.section) {
                const oldSection = train.schedule.sections[train.section];
                if(oldSection.type === "platform") {
                    this.deallocate(train);
                }
            }
            train.section = point.section;
            train.nextI = point.nextI;
            train.lastN = point.lastN;
            train.nextN = point.nextN;
            train.offset = point.offset - 0.05;
        },
        
        moveTrains: function(s) {
            for(const train of this.trains) {
                const remainingSections = train.schedule.sections.length
                    - train.section;
                const nextPoints = this.nextPoints(train);
                const nextSignals = nextPoints.filter(p => p.type === "signal");
                if(nextSignals.length === 1) { this.attemptAllocation(train); }
                const nextPoint = nextPoints[0];
                const nextSignal = nextSignals[0];
                this.proceedToPoint(train, nextPoint);
                if(s.states[nextSignal.signalI].state === SignalState.DANGER) {
                    train.advanceTimer = 0.0;
                } else if(nextPoint.type === "signal") {
                    train.advanceTimer += r.deltaTime;
                    if(train.advanceTimer > TRAIN_TIME_PER_BLOCK) {
                        if(nextSignals.length > 1) {
                            this.proceedToPoint(train, nextPoints[1]);    
                        } else if(remainingSections == 1) {
                            train.age = Infinity;
                        }
                        train.advanceTimer = 0.0;
                    }
                } else {
                    const section = train.schedule.sections[train.section];
                    if(train.age > section.departure * 60) {
                        train.headcode = section.headcode
                            + train.headcode.substring(2);
                        this.proceedToPoint(train, nextPoints[1]);
                    }
                }
            }
            this.trains = this.trains.filter(t => t.age !== Infinity);
        }

    };
}
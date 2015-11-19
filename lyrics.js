if (Meteor.isClient) {
    // counter starts at 0
    Session.setDefault('counter', 0);

    window.onload = function () {
        selected = new Selected();
        selected.init();
    };

    var Selected = function () {
        this.audio = document.getElementById('audio');
        this.lyricContainer = document.getElementById('lyricContainer');
        this.currentLine = document.getElementById('current_line');
        this.playlist = document.getElementById('playlist');
        this.elapsedTimeContainer = document.getElementById('elapsedtime');
        this.totalTimeContainer = document.getElementById('totaltime');
        this.sliderCircle = document.getElementById('slider-circle');
        this.adContainer = document.getElementById('ad_container');
        this.langControl = document.getElementById('switch1');
        this.currentIndex = 0;
        this.lyric = null;
        this.lyricStyle = 0; //random num to specify the different class name for lyric
        this.lang = "en";
        this.songs = ['lmfao', 'lmfao', 'lmfao'];
    };
    Selected.prototype = {
        constructor: Selected, //fix the prototype chain
        init: function () {
            //get all songs and add to the playlist
            var that = this,
            //allSongs = this.playlist.children[0].children,
                currentSong, randomSong;

            //get the hash from the url if there's any.
            var songName = window.location.hash.substr(1);

            //set the song name to the hash of the url
            window.location.hash = window.location.hash || randomSong;

            this.audio.onended = function () {
                that.playNext(that);
            }
            // this.audio.onerror = function (e) {
            //     that.lyricContainer.textContent = '!fail to load the song :(';
            // };

            //enable keyboard control , spacebar to play and pause
            window.addEventListener('keydown', function (e) {
                if (e.keyCode === 32) {
                    if (that.audio.paused) {
                        that.audio.play();
                    } else {
                        that.audio.pause();
                    }
                }
            }, false);


            var index = 1;
            setInterval(displayAd, 15000);
            function displayAd(){
                var ad = 'ads/ad' + index + '.jpg';
                console.log("ad", ad);
                that.adContainer.style.backgroundImage = "url(" + ad + ")";
                index++;
                if(index == 8){
                    index = 1;
                }
            }

            this.langControl.addEventListener('click', function(ln) {
                if(!ln){
                    return;
                }
                that.lang = ln;
            });
            //this.play(randomSong);
        },

        secondsToString: function (totalSeconds) {
            var minutes = Math.floor(totalSeconds / 60);
            var seconds = Math.floor(totalSeconds - (minutes * 60));
            var secStr = "0" + seconds;
            return minutes + ":" + secStr.substring(secStr.length - 2);
        },

        play: function (songName) {


            if($("#play").hasClass('paused')) {
                $("#play").removeClass('paused');
                this.pause();
                return;
            } else {
                $("#play").addClass('paused');

            }


            console.log("Play song ...");
            var that = this;
            this.audio.src = './lmfao.mp3';
            //reset the position of the lyric container
            //this.lyricContainer.style.top = '130px';
            //empty the lyric
            this.lyric = null;
            //this.lyricContainer.textContent = 'loading...';
            //this.currentLine.textContent = 'loading...';
            this.lyricStyle = Math.floor(Math.random() * 4);
            this.audio.oncanplay = function () {
                console.log("loading lyrics ...", that.lang);
                if (that.lang != "en") {
                    that.getLyric(that.audio.src.replace('.mp3', '-spanish.txt'));
                }
                that.getLyric(that.audio.src.replace('.mp3', '-english.lrc'));
                this.play();
            };
            //sync the lyric
            this.audio.ontimeupdate = function (e) {

                var totalTime = that.audio.duration;

                var elapsedTime = that.audio.currentTime;
                //derive our own % so we can draw fractions. progress obj only has whole percents
                var percentPlayed = (elapsedTime/totalTime)*100;

                that.elapsedTimeContainer.innerHTML = that.secondsToString(elapsedTime);
                that.totalTimeContainer.innerHTML = that.secondsToString(totalTime);
                that.sliderCircle.style.left = percentPlayed + "%";


                console.log("Sync lyrics ....")
                if (!that.lyric) return;
                for (var i = 0, l = that.lyric.length; i < l; i++) {
                    /*preload the lyric by 0.50s*/
                    if (this.currentTime > that.lyric[i][0] - 0.50) {
                        $('p', that.lyricContainer).removeClass('current');
                        $($('p', that.lyricContainer).get(i)).addClass('current');

                        if (i > 2) {
                            that.lyricContainer.style.top = (-29 * (i - 2)) + 'px';
                        }
                    }
                }
            };
        },
        playNext: function (that) {
            var songName = "lmfao";
            //var allSongs = this.playlist.children[0].children,
            //    nextItem;
            ////reaches the last song of the playlist?
            //if (that.currentIndex === allSongs.length - 1) {
            //    //play from start
            //    that.currentIndex = 0;
            //} else {
            //    //play next index
            //    that.currentIndex += 1;
            //}
            //nextItem = allSongs[that.currentIndex].children[0];
            //that.setClass(that.currentIndex);
            //var songName = nextItem.getAttribute('data-name');
            window.location.hash = songName;
            that.play(songName);
        },
        pause : function(){
            this.audio.pause();
        },
        setClass: function (index) {

        },
        getLyric: function (url) {
            var that = this,
                request = new XMLHttpRequest();
            request.open('GET', url, true);
            request.responseType = 'text';
            //fix for the messy code problem for Chinese.  reference: http://xx.time8.org/php/20101218/ajax-xmlhttprequest.html
            //request['overrideMimeType'] && request.overrideMimeType("text/html;charset=gb2312");
            request.onload = function () {
                that.lyric = that.parseLyric(request.response);
                //display lyric to the page
                that.appendLyric(that.lyric);
            };
            // request.onerror = request.onabort = function (e) {
            //     that.lyricContainer.textContent = '!failed to load the lyric :(';
            // }
            //this.lyricContainer.textContent = 'loading lyric...';
            request.send();
        },
        parseLyric: function (text) {
            //get each line from the text

            var lines = text.split('\n'),
            //this regex mathes the time [00.12.78]
                pattern = /\[\d{2}:\d{2}.\d{2}\]/g,
                result = [];

            // Get offset from lyrics
            var offset = this.getOffset(text);

            //exclude the description parts or empty parts of the lyric
            while (!pattern.test(lines[0])) {
                lines = lines.slice(1);
            }

            //remove the last empty item
            lines[lines.length - 1].length === 0 && lines.pop();
            //display all content on the page
            lines.forEach(function (v, i, a) {
                var time = v.match(pattern),
                    value = v.replace(pattern, '');
                time.forEach(function (v1, i1, a1) {
                    //convert the [min:sec] to secs format then store into result
                    var t = v1.slice(1, -1).split(':');
                    result.push([parseInt(t[0], 10) * 60 + parseFloat(t[1]) + parseInt(offset) / 1000, value]);
                });
            });
            //sort the result by time
            result.sort(function (a, b) {
                return a[0] - b[0];
            });
            return result;
        },
        appendLyric: function (lyric) {
            var that = this,
                lyricContainer = this.lyricContainer,
                fragment = document.createDocumentFragment();
            //clear the lyric container first
            //this.lyricContainer.innerHTML = '';
            lyric.forEach(function (v, i, a) {
                var line = document.createElement('p');
                //line.id = 'line-' + i;
                if(i === 0) {
                    line.className = "current";
                }
                line.textContent = v[1];
                fragment.appendChild(line);
            });
            lyricContainer.appendChild(fragment);
        },
        getOffset: function (text) {
            //Returns offset in miliseconds.
            var offset = 0;
            try {
                // Pattern matches [offset:1000]
                var offsetPattern = /\[offset:\-?\+?\d+\]/g;

                if (text.match(offsetPattern)) {
                    // Get only the first match.
                    var offset_line = text.match(offsetPattern)[0],
                    // Get the second part of the offset.
                        offset_str = offset_line.split(':')[1];
                    // Convert it to Int.
                    offset = parseInt(offset_str);
                }
            } catch (err) {
                offset = 0;
            }
            return offset;
        }
    };
}

if (Meteor.isServer) {
    Meteor.startup(function () {
        // code to run on server at startup
    });
}
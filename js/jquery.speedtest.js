/*
 * jQuery Download Speed test v0.1.0
 * http://www.codeanvil.co/smythy/jquery/download-speed-test
 *
 * Copyright 2011, Nemanja Cimbaljevc
 *
 * Date: Sun Nov 13 20:18:56 2011 +0100
 */

(function( $ ){

    $.fn.caDownloadTest = function(){};

    $.fn.caDownloadTest.data = {
        runtime : 0,
        fileDownloadTime: 0, //probably downloadTime could do job for us, but since it's global variable, let's be sure this value is not changed afterward
        files : [
            {
                size:'512',
                name : '512-kb'
            }, 
            {
                size:'1095',
                name : '1-mb'
            },
            {
                size:'1095',
                name : '1-mb'
            },
            {
                size:'1743',
                name : '2-mb'
            },
            {
                size:'1743',
                name : '2-mb'
            },
            {
                size:'3408',
                name : '3-mb'
            },
            {
                size:'3408',
                name : '3-mb'
            },
            {
                size:'5120',
                name : '5-mb'
            },
            {
                size:'5120',
                name : '5-mb'
            },
            {
                size:'10240',
                name : '10-mb'
            },
            {
                size:'10240',
                name : '10-mb'
            },
            {
                size:'20480',
                name : '20-mb'
            },
            {
                size:'20480',
                name : '20-mb'
            },
            {
                size:'51200',
                name : '50-mb'
            },
            {
                size:'51200',
                name : '50-mb'
            }],
        ext : '',
        speed : [],
        maxBitrate: 0,
        averageBitrate: 0,
        correction : 0.95,
        interrupt: true,
        timer: {}
    };
    $.fn.caDownloadTest.session = {
        startAt : 0,
        endAt : 0,
        useFile : 0,
        randomOscillation : 0,
        request: {}
    }
    $.fn.caDownloadTest.option = {
        arrow : 'speedTestArrowHolder',
        response : 'responseHolder',
        result : {
            selector : 'bandwidthReading',
            textTag : 'p',
            valueTag : 'h3'
        },
        tempResult : {
            tempSelector : 'speedTest',
            tempValueTag : 'p'
        },
        text : {
            prepare : 'Der Test startet gleich...',
            reading : 'Ihre aktuelle Bandbreite ist:'
        },
        useFile : 0,
        prepareMaxTime : 3,
        runtimeMaxTime : 17,
        runtimeOffset: 5
    };

    var option = $.fn.caDownloadTest.option;
    var data = $.fn.caDownloadTest.data;
    var session = $.fn.caDownloadTest.session;

    var methods = {
        prepare : function(options) {
            return this.each(function() {
                // Merge options.
                $.fn.caDownloadTest.option = $.extend(
                    $.fn.caDownloadTest.option,
                    options
                );
                // Change text
                $('#'+option.result.selector+' '+option.result.textTag).html(option.text.prepare);
                $('#'+option.result.selector+' '+option.result.valueTag).html('<img src="assets/img/ajax-loader.gif" alt="" />');

                //console.debug("data.runtimeMaxTime + 7 = " + ((data.runtimeMaxTime + 7)*1000).toString());

                // Set callback functions.        
                callback = {
                    complete : function(){
                        if (data.fileDownloadTime < option.prepareMaxTime) {
                            nextFile = session.useFile + 1;
                            if ( data.files[nextFile] ) {
                                session.useFile += 1;
                                $(this).downloadTest('record', session.useFile, callback);
                            } else {
                                // Start test
                                $(this).downloadTest('start', getAvgSpeed(), session.useFile);
                            }
                        } else {
                            $(this).downloadTest('start', getAvgSpeed(), session.useFile);
                        }
                        $(this).downloadTest('animateArrow', getAvgSpeed(false));
                    }
                };
                data.interrupt = false;
                data.timer = window.setTimeout(function(){
                  session.request.abort();
                  data.interrupt = true;
                  console.debug("!!!! interrupting measuring process !!!!!");
                  $(this).downloadTest('animateArrow', 0);
                  $('#'+option.result.selector+' '+option.result.valueTag).html(getAvgSpeed(true));
                  $('#'+option.tempResult.tempSelector+' '+option.tempResult.tempValueTag).css('display','none');
                  updateShareThis();
                }, (option.runtimeMaxTime + option.runtimeOffset)*1000);

                $(this).downloadTest('record', option.useFile, callback);
            })
        },
        start : function(speed, useFile) {
            return this.each(function() {
                $(this).downloadTest('animateArrow', speed);
                $('#'+option.result.selector+' '+option.result.textTag).html(option.text.reading);
                callback = {
                    complete : function(){
                        console.debug("data.interrupt: " + data.interrupt);
                        if (data.interrupt) return false;

                        if (data.fileDownloadTime < option.prepareMaxTime) {
                            if (data.files[useFile + 1]) {
                                session.useFile += 1;
                            }
                        }
                        if (data.runtime < option.runtimeMaxTime) {
                            if ( data.files[session.useFile] ) {
                                $(this).downloadTest('record', session.useFile, callback);
                                $(this).downloadTest('animateArrow', getAvgSpeed(false));
                            } else {
                                window.clearTimeout(data.timer);
                                data.interrupt = true;
                                $(this).downloadTest('animateArrow', 0);
                                $('#'+option.result.selector+' '+option.result.valueTag).html(getAvgSpeed(true));
                                $('#'+option.tempResult.tempSelector+' '+option.tempResult.tempValueTag).css('display','none');
                                updateShareThis();
                            }
                        } else {
                            window.clearTimeout(data.timer);
                            data.interrupt = true;
                            $(this).downloadTest('animateArrow', 0);
                            $('#'+option.result.selector+' '+option.result.valueTag).html(getAvgSpeed(true));
                            $('#'+option.tempResult.tempSelector+' '+option.tempResult.tempValueTag).css('display','none');
								$('#restart').removeClass('hide');
                            updateShareThis();
                        }
                    }
                };

                $(this).downloadTest('record', session.useFile, callback);
            })
        },
        restart : function() {
            $(this).downloadTest('animateArrow', 0);
            session = {
                startAt : 0,
                endAt : 0,
                useFile : 0
            }
            data.runtime = 0;
            data.fileDownloadTime = 0;
            data.speed = [];
            $(this).downloadTest('prepare');
        },
        record : function( useFile , callback ) {
            return this.each(function() {
                session.useFile = useFile;
                file = data.files[useFile].name + data.ext;
                session.request = $.ajax({
                    url: "record.php",
                    data : 'file='+file,
                    beforeSend : function() {
                        session.startAt = getUnixTime();
                    },
                    complete: function(){
                        if (session.startAt == 0 && session.endAt == 0)
                          return false;

                        data.speed.push(calculateSpeed());
                        if(callback.complete){
                            callback.complete();
                        }
                    },
                    success: function() {
                        session.endAt = getUnixTime();
                    },
                    error: function() {
                        session.startAt = 0;
                        session.endAt = 0;
                    }
                });
            })
        },
        animateArrow : function(speedValueKbps) {
            return this.each(function() {
			    $('#'+option.result.selector+' '+option.result.textTag).html(option.text.reading);
				$('#'+option.result.selector+' '+option.result.valueTag).html('<img src="http://internetspeedtest.ch/assets/img/ajax-loader.gif" alt="" />');
				$('#'+option.tempResult.tempSelector+' '+option.result.valueTag).css('display','block');
				
                if(session.randomOscillation > 0) {
                    clearInterval(session.randomOscillation);
                    session.randomOscillation = 0;
                }

                speedValue = speedValueKbps/1024;
                if(speedValue == 0 || data.runtime > option.runtimeMaxTime){
                    $('#speedTestArrowHolder').animate({
                        rotate: 0}, 1200, 'swing');
                    $('#speedTestArrowHolder').stop();
                } else if (speedValue <= 20) {
                    if(session.randomOscillation == 0) {
                        session.randomOscillation = setInterval(function() {
                            var randomFactor = Math.floor((Math.random() - Math.random())*10);
                            var elevation = ((26*(speedValue/5)-5) + randomFactor);
                            $('#'+option.tempResult.tempSelector+' '+option.tempResult.tempValueTag).html(Math.abs((speedValue + randomFactor/5.3)).toFixed(2) + ' Mbit/s ');
                            $('#speedTestArrowHolder').animate({
                                rotate: elevation
                            }, 300, 'swing');
                        }, 300);
                    }
                } else {
                    $('#speedTestArrowHolder').animate({
                        rotate: 78+26*(speedValue/20)
                    }, 500, 'swing');
                    if(session.randomOscillation == 0) {
                        session.randomOscillation = setInterval(function() {
                            var randomFactor = Math.floor((Math.random() - Math.random())*10);
                            var elevation = (73+(26*(speedValue/20)) + randomFactor);
                            $('#'+option.tempResult.tempSelector+' '+option.tempResult.tempValueTag).html(Math.abs((speedValue + 4*randomFactor/5.3)).toFixed(2) + ' Mbit/s ');
                            $('#speedTestArrowHolder').animate({
                                rotate: elevation
                            }, 300, 'swing');
                        }, 300);
                    }
                }
            })
        }
    }

    $.fn.downloadTest = function(method) {
        if ( methods[method] ) {
            return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if ( typeof method === 'object' || ! method ) {
            return methods.prepare.apply( this, arguments );
        } else {
            $.error( 'Unknown method \''+method+'\'' );
        }
    };

    function getUnixTime() {
        time = new Date();
        return time.getTime();
    }

    function calculateSpeed() {
        downloadTime = (session.endAt - session.startAt)/1000;
        dataLength = data.files[session.useFile].size;
        // Calculate download speed in kilobytes
        downloadSpeed = dataLength/downloadTime;
        // kilobits per second speed conversion.
        speed = downloadSpeed*8/data.correction;
        // Increate runtime.
        data.runtime += downloadTime;
        data.fileDownloadTime = downloadTime;
        
        var avg = 0;
        //skipping the first record because it's always incorrect - downloading 512kb is used rather for the cold start
        if (data.speed.length > 1) {
          for (var i = 1; i < data.speed.length; i ++) 
            avg += data.speed[i];
          avg /= (data.speed.length - 1);
        }
        
        if (speed > data.maxBitrate && (data.maxBitrate == 0 || data.speed.length < 2 || (avg > 0 && speed <= avg * 10))) {
          data.maxBitrate = speed;
        } else if (data.maxBitrate != 0 && avg != 0 && speed > avg * 10) {
          speed = avg;          
        }
        if (speed == avg && speed != 0) {
	  console.debug("set data.averageBitrate 0");
          data.averageBitrate = (data.maxBitrate + avg)/2;
          speed = data.averageBitrate;
        } else if (avg != 0) {
	  console.debug("set data.averageBitrate 1");
          if (5 * speed < (data.maxBitrate + avg) || 4 * (data.maxBitrate + avg) < speed) {
            data.averageBitrate = (21 * data.maxBitrate + 9 * avg + speed)/31;
            speed = data.averageBitrate;
   	    console.debug("set data.averageBitrate 2");
          } else {
            data.averageBitrate = (7*data.maxBitrate + 3*avg + speed)/11;
 	    console.debug("set data.averageBitrate 3");
          }
        } else {
          data.averageBitrate = speed;
	  console.debug("set data.averageBitrate 4");
        }
	      
        console.debug("downloadTime: " + downloadTime + ", dataLength: " + dataLength + ", downloadSpeed: " + downloadSpeed + ", original speed: " + (downloadSpeed*8/data.correction) + ", returned speed: " + speed + ", maxBitrate: " + data.maxBitrate + ", avg: " + avg + ", averageBitrate: " + data.averageBitrate);
        
        return speed;
    }

    function getAvgSpeed(format) {
        var avg = data.averageBitrate;
        
        if (format === true){
            if(avg > 1024){
                avg = avg/1024;
                avg = avg.toFixed(2) + ' Mbit/s ';
            } else {
                avg = avg.toFixed(2) + ' Kbit/s ';
            }
        }
        
        return avg;
    }

    function updateShareThis() {
        $newTitle = 'Meine Internetgeschwindigkeit ist '+ getAvgSpeed(true) +'. Was is deine?';
        $newLink = encodeURI($BASE_URL+'/share.php?s='+ getAvgSpeed(true));
        $('span[class="st_facebook"]').html('');
        $('span[class="st_twitter"]').html('');
        $('span[class="st_sharethis"]').html('');
        $('span[class="st_facebook"]').attr('st_title', $newTitle);
        $('span[class="st_twitter"]').attr('st_title', $newTitle);
        $('span[class="st_sharethis"]').attr('st_title', $newTitle);
        $('span[class="st_facebook"]').attr('st_url', $newLink);
        $('span[class="st_twitter"]').attr('st_url', $newLink);
        $('span[class="st_sharethis"]').attr('st_url', $newLink);
        $('span[class="st_facebook"]').attr('st_processed', null);
        $('span[class="st_twitter"]').attr('st_processed', null);
        $('span[class="st_sharethis"]').attr('st_processed', null);
        stButtons.makeButtons(); // Renew buttons
    }

    $.downloadSpeedTest = function(args) {
	    $('#'+option.result.selector+' '+option.result.textTag).html(option.text.prepare);
		setTimeout(function() {
        $(document).downloadTest(args);
		});        
    }
    $.downloadSpeedTest();
})( jQuery );

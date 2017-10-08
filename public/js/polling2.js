    

    var socket = io.connect("https://microsoft.tapptech.org");

        socket.on("connect", function () {
        console.log("Connected!");
        socket.emit('cid', clientid)
    });

    socket.on("arrived", function(data) {
        // todo: add the tweet as a DOM node
        if (navigator.vibrate) {
            navigator.vibrate([1000]);
        }
    
        	window.location.replace("/finished");
        	//console.log("assigned!")
        	//$("#helpText").text("Your request is assigned to: " + data.assignee);
        	//console.log(data.time);

        	//$("#timerText").remove();

    });
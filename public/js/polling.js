    

    var socket = io.connect("https://microsoft.tapptech.org/");

        socket.on("connect", function () {
        console.log("Connected!");
        socket.emit('cid', clientid)
    });

	var time = 15;
	var x = setInterval(function() {

	  // Get todays date and time
	  console.log("hey!")
	  // Find the distance between now an the count down date
	  time = time - 1;

	  $("#timerText").text(time);

	  if (time < 1) {
	    clearInterval(x);
	    window.location.replace("/unavailable?productid="+productid);
	  }
	}, 1000);

    socket.on("receive", function(data) {
        // todo: add the tweet as a DOM node

		if (navigator.vibrate) {
			navigator.vibrate([1000]);
		}
	
        if(data.assignee != false){
        	window.location.replace("/paired?id="+clientid);
        	//console.log("assigned!")
        	//$("#helpText").text("Your request is assigned to: " + data.assignee);
        	//console.log(data.time);

        	//$("#timerText").remove();

        }
    });
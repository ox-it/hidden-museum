define(["backbone", "hbs!app/templates/interactive/sextant"],
    function(Backbone, sextantTemplate) {

        //sextant arm
        armPivot = {x:0.0, y:-0.36};  //rotation centre for the arm as proportion of width, from geometric centre

	    spinAngle = 0;

	    setSextantArmAngle = function (deg) {
            var armAngle = deg/2
		    var rad = armAngle * Math.PI / 180;
		    var r00 = Math.cos(rad);
		    var r11 = r00;
		    var r01 = -Math.sin(rad);
		    var r10 = -1 * r01;
		    var width = $('#sextant-arm').width();
		    var x = armPivot.x * width;
		    var y = armPivot.y * width;
		    var tx = x - r00*x - r01*y;
		    var ty = y - r10*x -r11*y;

		    var matrix = "matrix(" + r00 + "," + r10 + "," + r01 + "," + r11 + "," + tx + "," + ty + ")";
		    $('#sextant-arm').css("transform", matrix);
	    };

	    spinSextantArm = function(angle) {
		    spinAngle += 0.5;
		    setSextantArmAngle(spinAngle);
		    setTimeout(spinSextantArm, 2);
	    };

    var SextantView = Backbone.View.extend({
        template: sextantTemplate,

        events: {
          "click .toggle": "toggleButtonHandler"
        },

        serialize: function() {
            var out = {};
            out.instructions = this.instructions[0];
            return out;
        },

        initialize: function(params) {
            this.step = 0;
            this.isTrackingOrientation = false;
            this.currentDeviceOrientation = {alpha:0, beta:0, gamma:0};
            this.startingDeviceOrientation = {alpha:0, beta:0, gamma:0};
            this.instructions = ["<p>Turn your back to the display case. Hold the phone straight up in front of you and press the start button</p>", 
                "<p>Now, tilt the camera up to the ceiling until the fire alarm nearest you is aligned with the red line</p>",
                "<p>While this shows you a simulated latitude, in reality the sextant shows you an angle and you'd consult charts to determine your latitude</p>"];
            this.instructionsColors = ['#ebddc1', '#ced19f', '#c8ad91'];
            var tapEnabled = true; //enable tap take picture
            var dragEnabled = false; //enable preview box drag across the screen
            var toBack = true; //send preview box to the back of the webview
            var rect = {x: 0, y: 175, width: 380, height:280};
	        if(typeof(cordova) !== 'undefined') {
		        cordova.plugins.camerapreview.startCamera(rect, "back", tapEnabled, dragEnabled, toBack);
	        }
            $('#content').css("background-color", "transparent");
        },
        afterRender: function() {
            this.setup();
        },
        setup: function() {
            $('#captured-image').css("background-image", "none");
            this.displayInstructions(0);
            setSextantArmAngle(0);
            this.setLatitudeIndicator(0);
            $(window).on('deviceorientation', this, this.deviceOrientationHandler);
        },
        toggleButtonHandler: function(ev) {
            var $target = $(ev.target);
            switch (this.step) {
                case 0: {
                    this.step = 1;                           
                    $target.text("stop");
                    this.takeHorizonImage(ev);
                    this.startTrackingOrientation(ev);
                    this.displayInstructions();
                    break;
                }        
                case 1: {
                    this.step = 2;
                    this.stopTrackingOrientation(ev);
                    this.displayInstructions();
                    $target.text("start again");
                    break;
                }
                case 2: {
                    this.step = 0;
                    this.setup();
                    this.displayInstructions();
                    $target.text("start");
                }
            }
        },
        startTrackingOrientation: function(ev) {           
            this.startingDeviceOrientation = null;
            this.isTrackingOrientation = true;
            console.log(this.startingDeviceOrientation);             
        },
        stopTrackingOrientation: function(ev) {
            this.isTrackingOrientation = false;
            $(window).off('deviceorientation', this.deviceOrientationHandler);
        },
        deviceOrientationHandler: function(ev) {
            var sextantView = ev.data;
            if (sextantView.isTrackingOrientation == true) {               
                if (sextantView.startingDeviceOrientation == null) {
                    sextantView.startingDeviceOrientation = ev.originalEvent;
                }
                sextantView.currentDeviceOrientation = ev.originalEvent;
                sextantView.updateOrientationIndicator();
            }
        },
        updateOrientationIndicator: function() {            
            var angle = this.currentDeviceOrientation.beta - this.startingDeviceOrientation.beta;
            console.log("current: " + this.currentDeviceOrientation.beta + " starting: "+ this.startingDeviceOrientation.beta + " angle: " + angle);
	        setSextantArmAngle(angle);
            this.setLatitudeIndicator(angle);
        },
        setLatitudeIndicator: function(angle) {
            var $valueIndicator = $('#value-indicator')[0];
            var $valueIndicatorOffset = $($valueIndicator).offset();
            var $parent = $('#value-indicator')[0].offsetParent;
            var $parentOffset = $($parent).offset();
            $valueIndicator.innerHTML = "latitude: " + angle.toPrecision(7).toString() + "&deg;";
            $($valueIndicator).offset({left: $valueIndicatorOffset.left, top: $parentOffset.top + $($parent).height() - $($parent).height()*angle/100});
        },
        takeHorizonImage: function(ev) {
            if(typeof(cordova) !== 'undefined') {
                cordova.plugins.camerapreview.setOnPictureTakenHandler(function(result){
                    $('#captured-image').css("background", "url("+result[1]+")");
                 });
                cordova.plugins.camerapreview.takePicture({maxWidth:640, maxHeight:640});
            }
        },
        displayInstructions: function() {
            var instructionsDiv = $('#instructions')[0];
            instructionsDiv.innerHTML = this.instructions[this.step];
            $(instructionsDiv).css('background-color', this.instructionsColors[this.step]); 
        },
	    cleanup: function() {
		    cordova.plugins.camerapreview.stopCamera();
	    },

    });

    return SextantView;

});
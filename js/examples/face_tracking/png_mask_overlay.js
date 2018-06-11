(function exampleCode() {
	"use strict";

	var numFacesToTrack	= 1;				// Set the number of faces to detect and track.

    
	brfv4Example.initCurrentExample = function(brfManager, resolution, draw) {

		brfManager.init(resolution, resolution, brfv4Example.appId);
		brfManager.setNumFacesToTrack(numFacesToTrack);

		// Relax starting conditions to eventually find more faces.

		var maxFaceSize = resolution.height;

		if(resolution.width < resolution.height) {
			maxFaceSize = resolution.width;
		}

		brfManager.setFaceDetectionParams(		maxFaceSize * 0.20, maxFaceSize * 1.00, 12, 8);
		brfManager.setFaceTrackingStartParams(	maxFaceSize * 0.20, maxFaceSize * 1.00, 32, 35, 32);
		brfManager.setFaceTrackingResetParams(	maxFaceSize * 0.15, maxFaceSize * 1.00, 40, 55, 32);

		// Load all image masks for quick switching.

		prepareImages(draw);

		// Add a click event to cycle through the image overlays.

		draw.clickArea.addEventListener("click", onClicked);
		draw.clickArea.mouseEnabled = true;
	};

	brfv4Example.updateCurrentExample = function(brfManager, imageData, draw) {

		brfManager.update(imageData);

		//draw.clear();

		// Face detection results: a rough rectangle used to start the face tracking.

		//draw.drawRects(brfManager.getAllDetectedFaces(),	false, 1.0, 0x00a1ff, 0.5);
		//draw.drawRects(brfManager.getMergedDetectedFaces(),	false, 2.0, 0xffd200, 1.0);

		// Get all faces. The default setup only tracks one face.

		var faces = brfManager.getFaces();

		// If no face was tracked: hide the image overlays.

		for(var i = 0; i < faces.length; i++) {

			var face = faces[i];			// get face
			var baseNode = _baseNodes[i];	// get image container

			if(		face.state === brfv4.BRFState.FACE_TRACKING_START ||
					face.state === brfv4.BRFState.FACE_TRACKING) {

				// Face Tracking results: 68 facial feature points.

				//draw.drawTriangles(	face.vertices, face.triangles, false, 1.0, 0x00a0ff, 0.4);
				//draw.drawVertices(	face.vertices, 2.0, false, 0x00a0ff, 0.4);

				// Set position to be nose top and calculate rotation.

				baseNode.x			= face.points[8].x;
				baseNode.y			= face.points[8].y;

				baseNode.scaleX		= (face.scale / 480) * (1 - toDegree(Math.abs(face.rotationY)) / 110.0);
				baseNode.scaleY		= (face.scale / 480) * (1 - toDegree(Math.abs(face.rotationX)) / 110.0);
                
				baseNode.rotation	= toDegree(face.rotationZ);

				baseNode.alpha		= 1.0;

			} else {

				baseNode.alpha		= 0.0;
			}
		}
	};

    brfv4Example.resetAll = function(scale, direction) {
        var i = _images.indexOf(_image);
        _imageDirectionOffset = scale;
        _imageScales[i] = direction;
        changeImage(_image, i);
    };   

    brfv4Example.positionOffest = function(direction, value) {
        if(direction == 0 || direction == 1) {
            var i = _images.indexOf(_image);
            _imageDirectionOffset[direction] += value;
            changeImage(_image, i);
        }
    };

    brfv4Example.ScaleOffest = function(scaleSize) {
        var i = _images.indexOf(_image);
         _imageScales[i] += scaleSize;
        changeImage(_image, i);
    };

    brfv4Example.downloadPicture = function() {
        var i = _images.indexOf(_image);
        console.log("Download: " + i + ".");
        var canvas = document.createElement('canvas');
        canvas.width = this.imageData.webcam.video.videoWidth;
        canvas.height = this.imageData.webcam.video.videoHeight;
        canvas.getContext('2d').drawImage(this.imageData.webcam.video, 0, 0);
        canvas.getContext('2d').translate(this.imageData.webcam.video.videoWidth, 0); 
        canvas.getContext('2d').scale(-1, 1);
        canvas.getContext('2d').translate(0, 0); 
        var canvas1 = this.dom.getElement("_drawing"); 
        canvas.getContext('2d').drawImage(canvas1, 0, 0);
        canvas.getContext('2d').drawImage(canvas, 0, 0);
        return canvas.toDataURL('image/png');
    };

	function onClicked(event) {
		var i = _images.indexOf(_image) + 1;

		if(i === _images.length) {
			i = 0;
		}

		_image = _images[i];
		changeImage(_image, i);
	}

	function changeImage(bitmap, index) {
   
		bitmap.scaleX = _imageScales[index] * 1.15;
		bitmap.scaleY = _imageScales[index] * 1.0;

        bitmap.x = -parseInt(bitmap.getBounds().width  * bitmap.scaleX * _imageDirectionOffset[0]);
        bitmap.y = parseInt(bitmap.getBounds().height * bitmap.scaleY * _imageDirectionOffset[1]);

		for(var i = 0; i < numFacesToTrack; i++) {

			var baseNode = _baseNodes[i];
			baseNode.removeAllChildren();

			if(i === 0) {
				baseNode.addChild(bitmap);
			} else {
				baseNode.addChild(bitmap.clone());
			}
		}
	}

	function prepareImages(draw) {

		draw.imageContainer.removeAllChildren();

		var i = 0;
		var l = 0;

		for(i = 0, l = numFacesToTrack; i < l; i++) {
			var baseNode = new createjs.Container();
			draw.imageContainer.addChild(baseNode);
			_baseNodes.push(baseNode);
		}

		for(i = 0, l = _imageURLs.length; i < l; i++) {
			_images[i] = new createjs.Bitmap(_imageURLs[i]);

			if(i === 0) {
				_image = _images[i];
				_image.image.onload = function() {
					changeImage(_image, 0);
				}
			}
		}
	}

    var _imageURLs      = ["assets/123.png",  "assets/234.png",  "assets/456.png",  "assets/345.png"];
	var _imageScales	= [1.2, 1.2, 1.1, 1.2];
    var _imageDirectionOffset = [0.5, 0.12];

	var _images			= [];
	var _image			= null;

	var _baseNodes		= [];

	var toDegree		= brfv4.BRFv4PointUtils.toDegree;

	brfv4Example.dom.updateHeadline("BRFv4 - advanced - face tracking - PNG/mask image overlay.\n" +
		"Click to cycle through images.");

	brfv4Example.dom.updateCodeSnippet(exampleCode + "");
})();
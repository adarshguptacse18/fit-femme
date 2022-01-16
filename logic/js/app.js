const videoDiv = document.getElementsByClassName('video')[0];
// const canvasDiv = document.getElementsByClassName('output5')[0];
const canvasDiv = document.getElementsByClassName('canvasOutput')[0];
const canvasCtx = canvasDiv.getContext('2d');

// const excerciseType = 'bicepCurls';
const exerciseInfo = {
	bicepCurls: {
	  index: [12, 14, 16],
	  upperLimit: 160,
	  upperLimit: 50,
	},
	squats: {
		index: [24, 26, 28],
		upperLimit: 170,
		lowerLimit: 50,
	},
	pushUps: {
		index: [12, 14, 16],
		upperLimit: 160,
		lowerLimit: 80,
	},
	crunches: {
		index: [12, 24, 26],
		upperLimit: 130,
		lowerLimit: 50,
	},
};

function updateCounterBox(value) {

}

function processUserExercise(excerciseType){
 // 0 => up, 1 => down
	let dir = 0;
	let repCount = 0;
	let lastUpdated = 0;
	function find_angle(A,B,C) {
		var AB = Math.sqrt(Math.pow(B.x-A.x,2)+ Math.pow(B.y-A.y,2));    
		var BC = Math.sqrt(Math.pow(B.x-C.x,2)+ Math.pow(B.y-C.y,2)); 
		var AC = Math.sqrt(Math.pow(C.x-A.x,2)+ Math.pow(C.y-A.y,2));
		if(BC * AB === 0) return 0;
		return Math.acos((BC*BC+AB*AB-AC*AC)/(2*BC*AB)) * 180 / Math.PI;
	}
	let once = false;
	function onResultsPose2(results) {
		if (!results.poseLandmarks) return;
		const position = results.poseLandmarks;
		const width = videoDiv.width;
		const height = videoDiv.height;
		const limbPositions = [];
		const indexArray = exerciseInfo[excerciseType].index;
		for (let i = 0; i < indexArray.length; i += 1) {
			limbPositions.push({
				x: position[indexArray[i]].x * width,
				y: position[indexArray[i]].y * height,
			});
		}
		let angle = Math.round(find_angle(...limbPositions));
	
		if(angle > exerciseInfo[excerciseType].upperLimit) {
			if(dir == 0) {
				dir = 1;
			}
		}
		if(angle < exerciseInfo[excerciseType].lowerLimit) {
			if(dir == 1 && Date.now() - lastUpdated > 1000) {
				dir = 0;
				repCount += 1;
				lastUpdated = Date.now();
				console.log("Rep Completed", repCount);
			}
		}
		return {limbPositions, angle};
	}
	function onResultsPose(results) {
		if(!results.poseLandmarks) return;
		const {limbPositions, angle} = onResultsPose2(results);
		document.body.classList.add('loaded');
		canvasCtx.save();
		canvasCtx.clearRect(0, 0, canvasDiv.width, canvasDiv.height);
		canvasCtx.drawImage(
			results.image, 0, 0, canvasDiv.width, canvasDiv.height);
	
		for (let i = 0; i < 2; i++) {
			canvasCtx.beginPath();
			canvasCtx.moveTo(limbPositions[i].x, limbPositions[i].y);
			canvasCtx.lineTo(limbPositions[i + 1].x, limbPositions[i + 1].y);
			canvasCtx.lineWidth = 2;
			canvasCtx.strokeStyle = "white";
			canvasCtx.stroke();
		}
		for (let i = 0; i < 3; i++) {
			canvasCtx.beginPath();
			canvasCtx.arc(limbPositions[i].x, limbPositions[i].y, 10, 0, Math.PI * 2);
			canvasCtx.fillStyle = "#AAFF00";
			canvasCtx.fill();
		}
		canvasCtx.font = "40px aerial";
		canvasCtx.fillText(angle, limbPositions[1].x + 10, limbPositions[1].y + 40);
		canvasCtx.restore();
	
	}
	const pose = new Pose({locateFile: (file) => {
		return `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.2/${file}`;
	}});
	pose.setOptions({
		modelComplexity: 1,
		smoothLandmarks: true,
		minDetectionConfidence: 0.6,
		minTrackingConfidence: 0.5,
	});
	pose.onResults(onResultsPose);
	const camera = new Camera(videoDiv, {
	onFrame: async () => {
		await pose.send({image: videoDiv});
	},
	width: 480,
	height: 480
	});
	camera.start();
}


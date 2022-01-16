let video;
let poseNet;
let newPoints = [];
let newAngle = 0;
let repCount = 0;
let dir = 0;
let shouldTimerStart = false;
const repCountElement = document.getElementsByName('repCount')[0];
const caloriesElement = document.getElementsByName('calories')[0];
const exerciseInfo = {
  bicepCurls: {
    index: [6, 8, 10],
    upperLimit: 160,
    lowerLimit: 50,
    cal: 0.1,
  },
  squats: {
    index: [12, 14, 16],
    upperLimit: 170,
    lowerLimit: 50,
    cal: 0.3,
  },
  pushUps: {
    index: [6, 8, 10],
    upperLimit: 160,
    lowerLimit: 80,
    cal: 0.6,
  },
  crunches: {
    index: [6, 12, 14],
    upperLimit: 130,
    lowerLimit: 50,
    cal: 0.25,
  },
};

function find_angle(A,B,C) {
  var AB = Math.sqrt(Math.pow(B.x-A.x,2)+ Math.pow(B.y-A.y,2));    
  var BC = Math.sqrt(Math.pow(B.x-C.x,2)+ Math.pow(B.y-C.y,2)); 
  var AC = Math.sqrt(Math.pow(C.x-A.x,2)+ Math.pow(C.y-A.y,2));
  if(BC * AB === 0) return 0;
  return Math.acos((BC*BC+AB*AB-AC*AC)/(2*BC*AB)) * 180 / Math.PI;
}

function setup() {
  createCanvas(500, 500).parent("canvas");
  video = createCapture(VIDEO);
  video.hide();
  poseNet = ml5.poseNet(video, modelReady);
  poseNet.on('pose', gotPoses);
  frameRate(30);
}

function updateRepCount() {
    repCountElement.textContent = repCount;
    const newCalories = Math.round(repCount * exerciseInfo[excerciseType].cal);
    caloriesElement.textContent = newCalories;
}
let once = true;
function gotPoses(poses) {
  if (poses.length > 0) {
    if(once) {
      console.log(poses[0]);
      once = false;
    }
    let points = [];
    for(let ind of exerciseInfo[excerciseType].index) {
      points.push({
        x: poses[0].pose.keypoints[ind].position.x,
        y: poses[0].pose.keypoints[ind].position.y,
      });
    }
    const angle = Math.round(find_angle(...points));
    if(angle > exerciseInfo[excerciseType].upperLimit) {
        if(dir == 0) {
            dir = 1;
        }
    }

    if(angle < exerciseInfo[excerciseType].lowerLimit) {
        if(dir == 1) {
            dir = 0;
            repCount += 1;
            console.log("Rep Completed", repCount);
            updateRepCount();
        }
    }
    if(newPoints.length == 3) {
      for(let i = 0; i < 3; i++) {
        newPoints[i].x = lerp(newPoints[i].x, points[i].x, 0.5);
        newPoints[i].y = lerp(newPoints[i].y, points[i].y, 0.5);
      }
    }
    else newPoints = points
    newAngle = angle;
  }
}

function modelReady() {
  console.log('model ready');
}

function draw() {
  image(video, 0, 0);
  if(newPoints.length == 3) {
    shouldTimerStart = true;
		fill(0, 255, 0);
    newPoints.forEach((p) => {
      circle(p.x, p.y, 30);
    })
    stroke(255);
    strokeWeight(2);

    for(let i = 1; i < newPoints.length; i++) {
      let prev = newPoints[i];
      let cur = newPoints[i - 1];
      line(prev.x, prev.y, cur.x, cur.y);
    }
  }
  // fill(255, 0, 0);
  // ellipse(noseX, noseY, d);
  //fill(0,0,255);
  //ellipse(eyelX, eyelY, 50);


}



try{
  let currentTime = Date.now();
  setInterval(() => {
    if(!shouldTimerStart) return;
    const timerElement = document.getElementsByName('timer')[0];
    const distance = Date.now() - currentTime;
    let minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    let seconds = Math.floor((distance % (1000 * 60)) / 1000);
    if(seconds < 10) seconds = `0${seconds}`;
    if(minutes < 10) minutes = `0${minutes}`;
    timerElement.textContent = `${minutes}:${seconds}`;
  }, 1000);
} catch(e) {

}

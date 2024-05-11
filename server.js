
import { Stream } from 'stream';
import express from 'express'
import expressWs from 'express-ws'; 
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import ffprobe  from 'ffprobe-static';
ffmpeg.setFfmpegPath(ffmpegStatic);
ffmpeg.setFfprobePath(ffprobe.path);
const app = express();
expressWs(app);

let imagesQueue = []; // mảnh lưu trữ các buffer của hình ảnh
const streamConnections = []; // Mảng lưu trữ các kết nối trong endpoint "/stream"
let flag=0;
let currentTime,startTime; //Các biến để xác định thời gian lưu ảnh
// Hàm biến đổi hình ảnh thành image
function createVideo(){
  ffmpeg({
    source: Stream.Readable.from(imagesQueue, { objectMode: false })
  })
    .output('video.mp4')
    .on('end', () => {
        console.log('Video created successfully!');
    })
    .on('error', (err) => {
        console.error('Error creating video:', err);
    })
    .run();
}
// Kiểm tra tin nhắn gửi đến /image (Esp32 gửi đến server)
app.ws('/image', function(ws, req) {
  ws.on('message', function(msg) {
    //kiểm tra xem tin nhắn có nhận lần đầu
    if(flag==0){
      startTime = performance.now();
    }
    flag=1;
    console.log('received: ', msg);
    // Gửi dữ liệu hình ảnh đến tất cả các kết nối trong "/stream" endpoint
    streamConnections.forEach(function(client) {
      client.send(msg);
    });
    //thêm tin nhắn vào buffer
    currentTime=performance.now();
    console.log(currentTime,startTime);
    imagesQueue.push(msg);
    //hàm biến ảnh thành video 10s thì hợp lại thành video 1 lần
    if (currentTime-startTime>=10000){
        createVideo();
        startTime = performance.now();
    }   
  });
});

// Kiểm tra kết nối đến stream (Client kết nối đến webServer)
app.ws('/stream', function(ws, req) {
  // Thêm kết nối mới vào mảng streamConnections khi có kết nối mới được thiết lập
  streamConnections.push(ws);

  ws.on('close', function() {
    // Xóa kết nối đã đóng khỏi mảng streamConnections
    const index = streamConnections.indexOf(ws);
    if (index !== -1) {
      streamConnections.splice(index, 1);
    }
  });
});


app.listen(8080, () => { console.log("Server listening started on port 8080") })
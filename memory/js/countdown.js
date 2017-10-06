//====== Countdown class ===========
function CountDown(elem) {
   this.countdownSecs = 0;
   this.timer = 0;
   this.startTime = 0;
   this.elapsedSecs = 0;
   this.secsLeft = 0;
   this.$displayElem = elem;
     
   this.SecondsLeft = function() {
      return this.countdownSecs - this.elapsedSecs;
   }
   
   this.ElapsedSeconds = function() {
      return Math.floor((new Date() - this.startTime) / 1000);
   }
   
   this.StartTimer = function(startTme) {
      this.StopTimer();
      if (this.countdownSecs == 0) return;
      if (startTme) this.startTime = startTme;
      else this.startTime = new Date();
      this.CountdownTick();
      this.timer = window.setInterval(function() {this.CountdownTick()}.bind(this), 1000);
   }
     
   this.StopTimer = function() {
      if (this.timer == 0) return;
      window.clearInterval(this.timer);
      this.timer = 0;
      this.elapsedSecs = Math.floor((new Date() - this.startTime) / 1000);
      this.secsLeft = this.countdownSecs - this.elapsedSecs;
   }
   
   this.CountdownTick = function() {
      this.elapsedSecs = Math.floor((new Date() - this.startTime) / 1000);
      var left = this.countdownSecs - this.elapsedSecs;
      if (left < 0) {  
         this.StopTimer();  
         $(this).trigger("tick", [0]);
         return;
      }
      if (left % 10 == 0) $(this).trigger("tick", [left]);
   
      var mins = Math.floor(left / 60);
      var secs = left % 60;
      if (secs < 10) secs = "0" + secs.toString();
      
      this.$displayElem.text(mins + ":" + secs);
   }
}
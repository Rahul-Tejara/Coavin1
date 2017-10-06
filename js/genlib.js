// General function library
//-----------------
//-----------------------------
function UrlParam(name) {
   if (location.search == "") return "";
   var queryStr = location.search.substring(1).split('&');
   var pos;
   for (var i = 0; i < queryStr.length; i++) {
      pos = queryStr[i].indexOf("="); 
      if (queryStr[i].substr(0, pos) == name) return queryStr[i].substr(pos + 1);
   }
   return "";
}

//-----------------------------
function URLVariables(data) {
   var arr = data.split("&");
   var obj = new Object();
   var pos;
   for (var i =0; i < arr.length; i++) {
      pos = arr[i].indexOf("=");
      obj[arr[i].substr(0, pos)] = arr[i].substr(pos + 1);
   }
   return obj;
}

//------------------------------------
function GetCookieUser() {
   var cookieVariable = document.cookie.toString();
   if (cookieVariable.length > 0) {
      var offset = cookieVariable.indexOf("UserId=");
      if (offset >= 0) {
         offset += 7;
         var end = cookieVariable.indexOf(";", offset);
         if (end == -1) end = cookieVariable.length;
         return cookieVariable.substring(offset, end);
      }
   }
   return "";
}

//-----------------
function ShuffleArray(array) {
   var currentIndex = array.length;
   var temporaryValue, randomIndex;
   while (0 !== currentIndex) {
     // Pick a remaining element...
     randomIndex = Math.floor(Math.random() * currentIndex);
     currentIndex -= 1;
     // And swap it with the current element.
     temporaryValue = array[currentIndex];
     array[currentIndex] = array[randomIndex];
     array[randomIndex] = temporaryValue;
   }
}
//----------------
function RemoveFromArray(arr, val) {
   var i = arr.indexOf(val);
   if (i >= 0) arr.splice(i,1);
}

//----------------
function LocalStorageExists() {
   try {
      localStorage.setItem("test", "test");
      localStorage.removeItem("test");
      return true;
   } catch(e) {
      return false;
   }
}

//===== Classes ===========
//------------------
function CustomRandom(nseed) {  
   this.seed = nseed;  
   if (this.seed == 0) {
      var base = (new Date()).getTime().toString();
      this.seed = Number(base.substr(base.length - 8, 8));
   }   

   this.next = function(min, max) {  
      this.seed = (this.seed *9301 + 49297) % 233280;
      return Math.floor((this.seed/(233280.0)) * (max-min+1)) + min; 
   }  
}
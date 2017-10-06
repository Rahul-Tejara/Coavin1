	// create the module and name it TimeInc
var myApp = angular.module('myApp', []);
    
 


myApp.controller('uploadController', function($scope) {
    $scope.fileUpload = function(){
      var files = document.getElementById('file').files;
      if (files.length > 0) {
        for(var i=0; i<files.length ; i++){
          $scope.getBase64(i,files[i]);
          document.getElementById('error').innerHTML = "";
        }
     }else{
       document.getElementById('error').innerHTML = "Please select atlest one file";
     }
    }
    
    $scope.getBase64 = function(index, file) {
      
      var reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = function () {
      if(reader.result){
        $scope.dispaly(index, reader.result);
      };};
      reader.onerror = function (error) {
        console.log('Error: ', error);
      };
    }
      
    $scope.dispaly =  function(index,data){
      var div = document.createElement('div');
      div.className = "item";
      div.id = index;
      var img = document.createElement('img');
      img.src = data;
      div.appendChild(img);
      document.getElementById("c_list").appendChild(div);
      angular.element("input[type='file']").val(null);
    }

 });



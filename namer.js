angular.module('namer',[])
  .directive('namer',function(){
		return {
			scope:{},
			restrict:'A',
			link:function(scope,e,a){
				scope.fullName = a.first + ' ' + a.last
				scope.first=a.first
				scope.last=a.last
			},
			template:"<div class='style'>{{last}}, {{first}}</div>"
		}
})
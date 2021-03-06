'use strict'

var ref = new Firebase("https://pragueiroproducao.firebaseio.com");
if(ref.getAuth() === null) window.location.href = '/login';


angular.module('Pragueiro.controllers', [ 'firebase', 'ngSanitize', 'googlechart',  'angularGeoFire', 
	'ui.grid', 'ui.grid.pagination', 'ui.grid.selection', 'ui.grid.edit', 'ui.grid.resizeColumns', 'ngMap', 'checklist-model', 'angular.filter', 'ui.calendar',  'ui.grid.grouping'])
//'uiGmapgoogle-maps'
/*
.config(['uiGmapGoogleMapApiProvider', function (GoogleMapApi) {
	GoogleMapApi.configure({
		key: 'AIzaSyDDu-8XiPmbb5QbSlh-Dv4xyHF53iGUPOk',
		libraries: 'weather,geometry,visualization'
	});
}])
*/




angular.module('Pragueiro.config', ['ngRoute']);

angular.module('Pragueiro.constant', []).constant('Constant', {
	Url: 'https://pragueiroproducao.firebaseio.com',
	Message: {
		'Error: The specified password is incorrect.': 'A senha está inválida!',
		'Error: The specified email address is already in use.': 'O endereço de email já está em uso!'
	},
	todosFiliais: [],
	todosControleacessos: [],
	filialCorrente: {},
	menu: ''
});



angular.module('Pragueiro.services', []);

angular.module('Pragueiro.directives', []);

angular.module('Pragueiro', ['Pragueiro.controllers', 'Pragueiro.config', 'Pragueiro.constant', 'Pragueiro.services', 'Pragueiro.directives']);

angular.module('Pragueiro').run(['$rootScope', 'Session', 'Constant', function($rootScope, Session, Constant){

	var ref = new Firebase(Constant.Url);

	$rootScope.logout = function(){
		ref.unauth();
		window.location.href = '/login';
	};

	$rootScope.$on('$routeChangeStart', function(event, next, current) {
		Session.getUser();
	});

}]);

angular.element(document).ready(function() {
	angular.bootstrap(document, ['Pragueiro']);
});


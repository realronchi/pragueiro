//############################################################################################################################
//NECESSARIOS PRO MAPA FUNCIONAR, AQUI É BRUTO, SEM ANGULAR
var map = null;
var map_infestacao=null;
var heatmap=null;
var listHeat=[];

function initMap() {

	map_infestacao = new google.maps.Map(document.getElementById('map_infestacao'), {
		zoom: 16,
		mapTypeId: google.maps.MapTypeId.SATELLITE,
		mapTypeControl: false,
		zoomControl: true,
		mapTypeControl: false,
		scaleControl: false,
		streetViewControl: false,
		rotateControl: false
	});

	map = new google.maps.Map(document.getElementById('map'), {
		zoom: 16,
		mapTypeId: google.maps.MapTypeId.SATELLITE,
		mapTypeControl: false,
		zoomControl: true,
		mapTypeControl: false,
		scaleControl: false,
		streetViewControl: false,
		rotateControl: false
	});


};

//############################################################################################################################


(function(){

	'use strict'; 

	angular.module('Pragueiro.controllers').registerCtrl('homeCtrl', homeCtrl);

	homeCtrl.$inject = [ '$scope', '$compile', '$sce', 'Constant', 'Session', '$firebaseArray', '$firebaseObject', 'Notify', '$routeParams', '$geofire', 'NgMap', '$location', '$anchorScroll', '$window'];

	function homeCtrl($scope, $compile, $sce, Constant, Session, $firebaseArray, $firebaseObject, Notify, $routeParams,  $geofire, NgMap, $location, $anchorScroll, $window) {

		

		angular.extend($scope, {
			versao: '3.01',
			quadras: [],
			culturas:[],
			vistorias:[],
			variedades:[],
			usuarios:[],
			pragasEncontradasGeral:[],
			pragasExibir:[],
			mensagem_aviso : '',
			exibirNomeQuadra : true,
			selecionarTodasQuadras : true

		});


		$scope.renderHtml = function(html) {
			return html;
		};

		$scope.menu  = $sce.trustAsHtml(window.localStorage.getItem('menu'));
		$scope.fazendas  = JSON.parse(window.localStorage.getItem('todasFiliais'));
		$scope.todasFazendasAceemps = JSON.parse(window.localStorage.getItem('todasFazendasAceemps'));
		$scope.posicaoFilial = window.localStorage.getItem('posicaoFilial');
		$scope.fazenda  = $scope.fazendas[$scope.posicaoFilial];
		var key_usuario  = window.localStorage.getItem('key_usuario');


		$scope.formMapa = {
			quadras: []
		};
		$scope.formMapa.intesidade = 20;


		if(checkLocalHistoryCompatibilidade())
		{
			if(window.localStorage.getItem('exibirSomentePragasEncontradas')=='S')
			{
				$scope.exibirSomenteEn=true;
			}
			else
			{
				$scope.exibirSomenteEn=false;
			}
			//---------------------
			if(window.localStorage.getItem('exibirNomeQuadra')=='S')
			{
				$scope.exibirNomeQuadra=true;
			}
			else
			{
				$scope.exibirNomeQuadra=false;
			}
			//---------------------
			if(window.localStorage.getItem('intensidadeHeatMap')!=null)
			{
				$scope.formMapa.intesidade=Number(window.localStorage.getItem('intensidadeHeatMap'));
			}
		}


		$scope.myNumber = 5;
		$scope.table_pronta=false;
		$scope.todascoordenadasCentroidMapaInfestacao=[];
		$scope.todosControleacessos =[];
		
		$scope.mCountTamanhos = 0;
		$scope.mCont = 0;

		gravarAcesso();
		
		//atualizaTodasPragas();

		var chart1 = {};
		chart1.type = "ColumnChart";
		chart1.data = [
		['Component', 'cost'],
		['Software and hardware', 50000],
		['Hardware', 80000]
		];
		chart1.data.push(['Services',20000]);
		chart1.options = {chartArea:{height:'200',width:'100%'},
		legend:{ position: 'none'},
		'width':400,
		'height':225,
		vAxis: {
			gridlines: {
				color: 'transparent'
			}
		}
	};
	chart1.formatters = {
		number : [{
			columnNum: 1,
			pattern: "$ #,##0.00"
		}]
	};

	$scope.chart = chart1;


	$scope.aa=1*$scope.chart.data[1][1];
	$scope.bb=1*$scope.chart.data[2][1];
	$scope.cc=1*$scope.chart.data[3][1];

	initMap(new google.maps.LatLng(-20, -55), 4 );




	//############################################################################################################################
	//############################################################################################################################
	// BASICOS, NECESSARIOS PARA OS OUTROS
	//############################################################################################################################

	function gravarAcesso()
	{
		console.log('gravarAcesso');
		if(Session.getUser().uid!=null)
		{
			var refAcessos = new Firebase(Constant.Url + '/informacoes/' + Session.getUser().uid + '/acessos_web' );

			var acesso=[];
			acesso['key'] = refAcessos.push().key();
			acesso['data'] = new Date().getTime();
			acesso['key_usuario'] = Session.getUser().uid;
			acesso['versao'] = $scope.versao;
			acesso['tipo'] = 'WEB';
			var refAcessosGravar = new Firebase(Constant.Url + '/informacoes/' + Session.getUser().uid + '/acessos_web/'+acesso['key']  );

			refAcessosGravar.set(acesso);
		}
	}

	function atualizaCulturas()
	{
		console.log('atualizaCulturas');
		var refCultura = new Firebase(Constant.Url + '/cultura');
		refCultura.ref().on('child_added', function(snap) {
			$scope.culturas.push(snap.val());
		});
	}

	function atualizaVariedade(key_filial)
	{
		console.log('atualizaVariedade');
		var refVariedades = new Firebase(Constant.Url + '/variedade/'+ key_filial);
		refVariedades.ref().on('child_added', function(snap) {
			$scope.variedades.push(snap.val());
		});
	}

	function atualizaUsuarios()
	{
		console.log('atualizaUsuarios');
		var refUsuarios= new Firebase(Constant.Url + '/usuario');
		refUsuarios.ref().on('child_added', function(snap) {
			$scope.usuarios.push(snap.val());
		});
	}

	function atualizaPragas()
	{
		console.log('atualizaPragas');
		var refPraga= new Firebase(Constant.Url + '/praga');
		refPraga.ref().on('child_added', function(snap) {

			var praga=snap.val();
			var count_tamanho=0;
			var tamanhos=[];
			var primeiro_tamanho;
			for(var obj in praga.tamanho ){
				if(count_tamanho==0)
				{
					primeiro_tamanho=praga.tamanho[obj];
				}
				else
				{
					tamanhos.push(praga.tamanho[obj]);
				}
				count_tamanho++;

			}
			if(tamanhos.length==0)
			{
				praga['colspan']=2;			
				praga['class']='text-right';			
			}
			else
			{
				praga['colspan']=1;
				praga['class']='text-center';	
			}
			praga['primeiro_tamanho']=primeiro_tamanho;
			praga['tamanhos']=tamanhos;
			$scope.pragas.push(praga);
		});
	}

	function atualizaTodasPragas(fazenda)
	{
		console.log('atualizaTodasPragas');
		$scope.todasPragas=[];
		var refPraga= new Firebase(Constant.Url + '/praemp/' + fazenda.key );
		refPraga.ref().on('child_added', function(snap) {
			$('#myPleaseWait').modal('hide');
			var praga=snap.val();
			var count_tamanho=0;
			var tamanhos=[];
			var primeiro_tamanho;
			for(var obj in praga.tamanho ){
				var tam=praga.tamanho[obj];
				tam['id']=$scope.mCountTamanhos;
				tamanhos.push(tam);

				count_tamanho++;
				$scope.mCountTamanhos++;
			}


			if(tamanhos.length==0)
			{
				praga['colspan']=2;			
				praga['class']='text-right';	

				var tam={};
				tam['id']=$scope.mCountTamanhos;

				$scope.mCountTamanhos++;
				tamanhos.push(tam);		
			}
			else
			{
				praga['colspan']=1;
				praga['class']='text-center';	
			}			

			praga['primeiro_tamanho']=primeiro_tamanho;
			praga['tamanhos']=tamanhos;
			$scope.todasPragas.push(praga);
			$scope.pragasExibir = $scope.todasPragas;
		});
	}

	//############################################################################################################################
	//############################################################################################################################
	// FAZENDA/FILIAL
	//############################################################################################################################
	function atualizaListaFiliais()
	{
		console.log('atualizaListaFiliais');

		if(!$('#myPleaseWait').hasClass('in')){ $('#myPleaseWait').modal('show')};

		$scope.chengeFazenda($scope.fazenda);			

		var baseRef = new Firebase(Constant.Url);
		var refNovo = new Firebase.util.NormalizedCollection(
			[baseRef.child("/usuario/"+key_usuario+"/filial/"), "$key"],
			baseRef.child("/filial")
			).select(
			{"key":"$key.$key","alias":"key"},
			{"key":"filial.$value","alias":"filial"}
			).ref();

			refNovo.on('child_changed', function(snap) {
				$('#myPleaseWait').modal('hide');
				var objNovo = snap.val();
				var posicao = null;
				$scope.fazendas.forEach(function(obj) {
					if (obj.key === objNovo['filial'].key) {
						posicao = $scope.fazendas.indexOf(obj);
					}
				});
				if (posicao != null)
					$scope.fazendas[posicao] = objNovo['filial'];

				if(objNovo['filial'].key==$scope.fazenda.key)
				{
					window.localStorage.setItem('filialCorrente', JSON.stringify( objNovo['filial']));
					$scope.fazenda=objNovo['filial'];
					$scope.fazenda.aceemps = $scope.todasFazendasAceemps[$scope.fazenda.key].aceempsObj;
				}
				window.localStorage.setItem('todasFiliais', JSON.stringify( $scope.fazendas));

			});
		}	

		//---	

		function atualizaListaFiliais2()
		{

			return;
			var refUser = new Firebase(Constant.Url + '/usuarioxauth/'+Session.getUser().uid);		
			var obj = $firebaseObject(refUser);
			var key_usuario;
			obj.$loaded().then(function() {
				key_usuario= obj.$value;

				$scope.fazendas=[];
				var baseRef = new Firebase(Constant.Url);
				var refNovo = new Firebase.util.NormalizedCollection(
					[baseRef.child("/usuario/"+key_usuario+"/filial/"), "$key"],
					baseRef.child("/filial")
					).select(
					{"key":"$key.$value","alias":"usuario"},
					{"key":"filial.$value","alias":"filial"}
					).ref();

					var i=0;

					refNovo.on('child_added', function(snap) {

						$('#myPleaseWait').modal('hide');
						var obj= snap.val();
						$scope.fazendas.push(obj.filial);

						if(i==0)
						{

							$scope.chengeFazenda($scope.fazendas[0]);
							$scope.fazenda=$scope.fazendas[0];
						}

						if(!$scope.$$phase) {
							$scope.$apply();
						}
					});

					refNovo.on('child_changed', function(snap) {
						var objNovo= snap.val();

						var x=0;
						var posicao=null;
						$scope.fazendas.forEach(function(obj){
							if(obj.key === objNovo.filial.key)
							{ 
								posicao=x;
							}
							x++;

						});
						if(posicao!=null)
							$scope.fazendas[posicao]=objNovo.filial;

					});

					refNovo.on('child_removed', function(snap) {
						atualizaListaFiliais();
					});
					if($scope.fazendas.length==0)
					{
						$('#myPleaseWait').modal('hide');
					}
				});
		}		

		$scope.chengeSafra = function(){			
			$scope.table_pronta=false;
			$scope.vistorias=[];
			$('#myPleaseWait').modal('hide');
			atualizaListaQuadras();
		};

		$scope.chengeFazenda = function(fazenda){
			$('#myPleaseWait').modal('hide');
			//--------------------------------------
			//Controle Acesso	
			fazenda.aceempsObj = $scope.todasFazendasAceemps[fazenda.key].aceempsObj;

			atualizaTodasPragas(fazenda);

			$scope.ordsers=[];
			$scope.vistorias=[];

			var refOrdser = new Firebase(Constant.Url + '/ordser/' + fazenda.key);

			refOrdser.on('child_added', function(snap) {
				$('#myPleaseWait').modal('hide');
				var objNovo = snap.val();
				var x = 0;
				var posicao = null;
				$scope.ordsers.forEach(function(obj) {
					if (obj.key === objNovo.key) {
						posicao = x;
					}
					x++;

				});
				if (posicao == null && objNovo.aplagr) {
					$scope.ordsers.push(objNovo);
				}
				if (!$scope.$$phase) {
					$scope.$apply();
				}
			});
		};

		$scope.setaFazenda = function(fazenda){
			if(fazenda === null) return false;

			$scope.fazendas.forEach(function(item){
				if(item.key === fazenda.key) 	
				{
					$scope.data.fazenda = item;		
				}
			});
		};

		$scope.addPragasEncontradas = function(praga){
			var encontrou=false;
			$scope.pragasEncontradasGeral.forEach(function(item){
				if(item.key === praga.key) 	
				{
					encontrou=true;	
				}
			});
			if(!encontrou)
			{
				$scope.pragasEncontradasGeral.push(praga);
			}	
		};



	//############################################################################################################################
	//############################################################################################################################
	//LISTA VISTORIAS, SERVE PRO RESUMO E MAPA E OUTROS
	//############################################################################################################################

	function adicionaValores(vistoriaExistente, vistoriaNova)
	{
		console.log('adicionaValores');

		if(vistoriaExistente.valores==null) //A lista de valores é nulo, é o primeiro
		{
			vistoriaExistente['valores']=[];
			var valor={};
			valor['nome']=vistoriaNova.nome_valor;
			valor['qtde']=1;
			vistoriaExistente['valores'].push(valor);
		}
		else //Não é o primeiro
		{
			var tem=false;
			var posicao;
			vistoriaExistente.valores.forEach(function(obj){
				if(obj.nome==vistoriaNova.nome_valor)
				{
					posicao = vistoriaExistente.valores.indexOf(obj);
				}
			});
			if(posicao!=null)//Se não for nulo, adiciono qtde
			{
				vistoriaExistente.valores[posicao].qtde=vistoriaExistente.valores[posicao].qtde + 1;
			}
			else //senão é um novo valor
			{
				
				var valor={};
				valor['nome']=vistoriaNova.nome_valor;
				valor['qtde']=1;
				vistoriaExistente.valores.push(valor);
			}
		}

		return vistoriaExistente;
	}

	function percorrePragas(lista_agrupada)
	{
		console.log('percorrePragas');

		var pragas_com_valor=[];
		var i=0;

		$scope.todasPragas.forEach(function(objPraga)
		{			
			var pragaAtualizada=clone(objPraga);
			var count_tamanho=0;
			pragaAtualizada.index = pragas_com_valor.length;

			if(pragaAtualizada.tamanhos[0].key!=null) // COM TAMANHO
			{
				for(var objInterno_tamanho in pragaAtualizada.tamanho ){
					count_tamanho++;
					var encontrou=false;
					lista_agrupada.forEach(function(objInterno_lista){
						if(objInterno_lista.key_praga==pragaAtualizada.key && (objInterno_lista.key_tamanho=='' ? 'a' : objInterno_lista.key_tamanho)==pragaAtualizada.tamanho[objInterno_tamanho].key)
						{
							encontrou=true;
							if(objInterno_lista.valpre == null || objInterno_lista.valpre == false)
							{
								var valor_final;
								if(objInterno_lista.tipo=='PLA')
								{
									valor_final=(objInterno_lista.valor*100) / (objInterno_lista.quapla * objInterno_lista.qtde_ponto);
								}
								else
								{
									valor_final=objInterno_lista.valor/ objInterno_lista.qtde_ponto;
								}
								var newObjeto={valor:valor_final.toFixed(3), tamanho:pragaAtualizada.tamanho[objInterno_tamanho], praga: pragaAtualizada}
								pragas_com_valor.push(newObjeto);
								if(valor_final>0)
								{
									$scope.addPragasEncontradas(pragaAtualizada);
								}
							}
							else
							{
								
							}
						}
					});
					if(!encontrou)
					{
						var newObjeto={valor:'', tamanho:pragaAtualizada.tamanho[objInterno_tamanho], praga: pragaAtualizada}
						pragas_com_valor.push(newObjeto);
					}
				};

			}
			else //Não têm tamanho
			{
				lista_agrupada.forEach(function(objInterno_lista){

					if(objInterno_lista.key_praga==pragaAtualizada.key)
					{
						encontrou=true;
						if(objInterno_lista.valpre == null || objInterno_lista.valpre == false)
						{
							var valor_final;
							if(objInterno_lista.tipo=='PLA')
							{
								valor_final=(objInterno_lista.valor*100) / (objInterno_lista.quapla * objInterno_lista.qtde_ponto);
							}
							else
							{
								valor_final=objInterno_lista.valor/ objInterno_lista.qtde_ponto;
							}

							

							var newObjeto={valor:valor_final.toFixed(3),  praga: pragaAtualizada}
							pragas_com_valor.push(newObjeto);
							if(valor_final>0)
							{
								$scope.addPragasEncontradas(pragaAtualizada);
							}
						}
						else
						{
							
							var str_valores='';
							var x=0;
							objInterno_lista.valores.forEach(function(objValor){
								if(x!=0)
								{
									str_valores += '\n';
								}
								str_valores +=  objValor.nome + ' ' + (objValor.qtde * 100 / objInterno_lista.qtde_ponto).toFixed(2);

								x++;
							});


							var newObjeto={valor:str_valores,  valpre:true, praga: pragaAtualizada}
							pragas_com_valor.push(newObjeto);

							$scope.addPragasEncontradas(pragaAtualizada);
						}
					}
				});
				if(!encontrou)
				{					

					var newObjeto={valor:'', praga: pragaAtualizada}
					pragas_com_valor.push(newObjeto);
				}
			}
		});
		return pragas_com_valor;
	}

	function percorreVistorias(obj2, variedade)
	{
		console.log('percorreVistorias');

		if(!$('#myPleaseWait').hasClass('in')){ $('#myPleaseWait').modal('show')};
		
		var obj=clone(obj2);
		if(variedade!=null)
		{
			obj['variedade']=variedade;
			obj.quadra.nome += ' - ' + variedade.nome;
		}
		var count_usuarios=0;

		//--------USUARIO-----------------------------------
		for(var propertyName in obj.vistoria) 
		{
			count_usuarios++;

			var count_dias=0;
			var vistoria_dias=[];
			//-----------DIA---------------------------------------------------------
			for(var propertyName_Dia in obj.vistoria[propertyName]) 
			{
				count_dias++;

				var vistoria_dia_praga=[];
				var count_ponto=0;
				var key_estagio;
				//-----------PONTO---------------------------------------------------------
				for(var propertyName_ponto in obj.vistoria[propertyName][propertyName_Dia]) 
				{
					count_ponto++;

					var count_praga=0;

					for(var propertyName_vis in obj.vistoria[propertyName][propertyName_Dia][propertyName_ponto]) 
					{
						count_praga++;

						vistoria_dia_praga.push(obj.vistoria[propertyName][propertyName_Dia][propertyName_ponto][propertyName_vis]);
					}

					obj.qtde_praga=count_praga;
				}
				obj.qtde_ponto=count_ponto;
				//FIM-----------PONTO---------------------------------------------------------
				vistoria_dia_praga.sort(compare);
				var key_praga_old="";
				var key_tamanho_old="";
				var lista_agrupada=[];
				var dataExtenso="";
				var metodo="";									
				var dataMilis=0;
				var qtde_planta=0;
				//-----------PERCORRE DIA---------------------------------------------------------
				var listPontos=[];
				var contadorVisdia=0;
				for(var vis_det in vistoria_dia_praga )
				{
					
					if(variedade==null && vistoria_dia_praga[vis_det].key_variedade!=null)
					{
						for(var obj_variedades_cultura in $scope.variedades) 
						{
							var obj_varCul=$scope.variedades[obj_variedades_cultura];
							for(var obj_variedades in obj_varCul) 
							{
								{
									if(obj_varCul[obj_variedades].key == vistoria_dia_praga[vis_det].key_variedade)
									{ 
										obj['variedade']=obj_varCul[obj_variedades];
										break;
									}
								};
							}
							break;
						}
					}					

					if(contadorVisdia==0)
					{
						var objPonto={};
						objPonto['ponto']=vistoria_dia_praga[vis_det].ponto;
						objPonto['latitude']=vistoria_dia_praga[vis_det].latitude;
						objPonto['longitude']=vistoria_dia_praga[vis_det].longitude;
						listPontos.push(objPonto);
					}
					else
					{
						var mTem = false;

						for(var x in listPontos )
						{
							if (listPontos[x].ponto == vistoria_dia_praga[vis_det].ponto) {
								mTem = true;
								break;
							}
						}
						if (!mTem) {
							var objPonto={};
							objPonto['ponto']=vistoria_dia_praga[vis_det].ponto;
							objPonto['latitude']=vistoria_dia_praga[vis_det].latitude;
							objPonto['longitude']=vistoria_dia_praga[vis_det].longitude;
							listPontos.push(objPonto);												
						}
					}
					contadorVisdia++;
					dataExtenso=vistoria_dia_praga[vis_det].dataString;
					dataMilis=vistoria_dia_praga[vis_det].data;
					metodo=vistoria_dia_praga[vis_det].tipo == 'PLA' ? 'Planta' : '%';
					qtde_planta=vistoria_dia_praga[vis_det].quapla ;
					key_estagio=vistoria_dia_praga[vis_det].key_estagio;



					if(key_praga_old==vistoria_dia_praga[vis_det].key_praga)//Praga antiga, já teve anteriormente
					{
						if(key_tamanho_old==vistoria_dia_praga[vis_det].key_tamanho) //Tamanho antigo, já teve anteriormente
						{
							lista_agrupada[lista_agrupada.length-1]['qtde_ponto']=count_ponto;

							if(vistoria_dia_praga[vis_det].valpre == null || vistoria_dia_praga[vis_det].valpre==false) //Não é valor prévio
							{
								lista_agrupada[lista_agrupada.length-1].valor=lista_agrupada[lista_agrupada.length-1].valor+vistoria_dia_praga[vis_det].valor;
							}
							else //É valor prévio
							{												
								lista_agrupada[lista_agrupada.length-1]=adicionaValores(lista_agrupada[lista_agrupada.length-1], vistoria_dia_praga[vis_det]); 												
							}
						}
						else //Tamanho novo, não teve anteriormente
						{
							vistoria_dia_praga[vis_det]['qtde_ponto']=count_ponto;

							if(vistoria_dia_praga[vis_det].valpre == null || vistoria_dia_praga[vis_det].valpre==false) //Não é valor prévio
							{
								lista_agrupada.push(vistoria_dia_praga[vis_det]);
							}
							else
							{
								lista_agrupada.push(adicionaValores(vistoria_dia_praga[vis_det], vistoria_dia_praga[vis_det]));											
							}
						}
					}
					else //Praga nova, não teve anteriormente
					{
						vistoria_dia_praga[vis_det]['qtde_ponto']=count_ponto;

						if(vistoria_dia_praga[vis_det].valpre == null || vistoria_dia_praga[vis_det].valpre==false)
						{													
							lista_agrupada.push(vistoria_dia_praga[vis_det]);
						}
						else
						{
							lista_agrupada.push(adicionaValores(vistoria_dia_praga[vis_det], vistoria_dia_praga[vis_det]));		
						}											
					}
					key_praga_old=vistoria_dia_praga[vis_det].key_praga;
					key_tamanho_old=vistoria_dia_praga[vis_det].key_tamanho;

				}
				//FIM PERCORRE DIA---------------------------------------------------------

				obj['dataExtenso']=dataExtenso;
				obj['dataMilis']=dataMilis;
				obj['metodo']=metodo;
				obj['metodo']=metodo;
				obj['qtde_planta']=qtde_planta;
				obj['lista_pragas_encontradas']=lista_agrupada;
				obj['listPontos']=listPontos;

				$scope.usuarios.forEach(function(objInterno)
				{
					if(objInterno.key === propertyName)
					{ 
						obj['usuario']=objInterno;
					}
				});

				$scope.quadras.forEach(function(objInterno)
				{
					if(objInterno.quadraxcultura.key === obj.quadra.key)
					{ 
						obj['quadraxcultura']=objInterno.quadraxcultura;
						$scope.culturas.forEach(function(objInterno2){
							if(objInterno2.key+'' === objInterno.quadraxcultura.key_cultura)
							{ 
								obj['cultura']=objInterno2;

								for(var objInterno_est in objInterno2.estagios ){
									if(objInterno_est==key_estagio)
										obj['estagio']=objInterno2.estagios[objInterno_est];
								}
							}
						});
					}
				});


				obj.qtde_dia=count_dias;
				var pragas_com_valor = percorrePragas(lista_agrupada);

				$scope.myNumber=pragas_com_valor.length;
				obj['pragas_com_valor']=pragas_com_valor;
				obj['id']= new Date().getTime();
				obj['id']= new Date().getTime();

				$scope.ordsers.forEach(function(ordser) {
					for (var propertyName in ordser.execucoes) {
						var objExe=ordser.execucoes[propertyName];
						if(objExe.key_quadra==obj.quadra.key)
						{
							var dataExecucao=new Date(objExe.data);

							obj['datOrdser']= new Date(objExe.data);
							obj['datOrdserExtenso']= formatDate(dataExecucao);

							if($scope.fazenda.tipintapl!=null)//Se esta definido no cadastro da filial que tem um tipo
							{
								if($scope.fazenda.tipintapl=='Data atual')
								{
									obj['datOrdserIntervalo']=  $scope.diferencaData(dataExecucao, new Date());													
								}
								else
								{
									obj['datOrdserIntervalo']=  $scope.diferencaData(dataExecucao, new Date(dataMilis));
								}
							}
							else
							{
								obj['datOrdserIntervalo']=  $scope.diferencaData(dataExecucao, new Date(dataMilis));
							}
						}
					}
				});

				$scope.vistorias.push(clone(obj));
			}
			//FIM-----------DIA---------------------------------------------------------
			$scope.vistorias.sort(compareData);
			$scope.table_pronta=true;
			if(!$scope.$$phase) {
				$scope.$apply();
			}
		}
		//-----FIM USUARIO-----------------------------------
	}
	//---
	function atualizaVistorias()
	{
		console.log('atualizaVistorias');

		$('#myPleaseWait').modal('hide');
		var count_geral_id=0;
		$scope.vistorias=[];
		$scope.pragas_com_valor=[];
		var baseRef = new Firebase(Constant.Url);
		var refVis = new Firebase.util.NormalizedCollection(
			[baseRef.child("/vistoria/"+$scope.fazenda.key+"/"+$scope.safra.key+"/"), "$key"],
			baseRef.child("/quadra")
			).select(
			{"key":"$key.$value","alias":"vistoria"},
			{"key":"quadra.$value","alias":"quadra"}
			).ref();
			refVis.ref().on('child_added', function(snap) 
			{
				if(!$('#myPleaseWait').hasClass('in')){ $('#myPleaseWait').modal('show')};
				var obj2= snap.val();

				var mListVariedades=[];
				for(var itemQuadraXsafra in $scope.quadras )
				{
					if(obj2.quadra!=null && $scope.quadras[itemQuadraXsafra].quadraxcultura.key==obj2.quadra.key)
					{
						obj2.quadra.ativo=$scope.quadras[itemQuadraXsafra].quadraxcultura.ativo;
						obj2.quadra['key_cultura']=$scope.quadras[itemQuadraXsafra].quadraxcultura.key_cultura;
						if($scope.quadras[itemQuadraXsafra].quadraxcultura.hasOwnProperty("separar_variedade")){

							if($scope.quadras[itemQuadraXsafra].quadraxcultura.separar_variedade==true)
							{
								for(var var_quadraxsafra in $scope.quadras[itemQuadraXsafra].quadraxcultura.variedades ){
									mListVariedades.push(var_quadraxsafra);
								}
							}
						}
						break;
					}
				}

				if(obj2.quadra!=null &&  $scope.fazenda.mosdes==true || (obj2.quadra.ativo!=null && obj2.quadra.ativo==true))
				{
					if(obj2.quadra.ativo==false)
					{
						return;
					}
					//----
					//SEPARA POR VARIEDADE, FAZ DESSE JEITO
					if(mListVariedades.length>0)//SEPARA POR VARIEDADE, FAZ DESSE JEITO
					{
						for(var keyVar in mListVariedades) 
						{

							var obj=clone(obj2);
							for(var obj_variedades_cultura in $scope.variedades) 
							{
								var obj_varCul=$scope.variedades[obj_variedades_cultura];
								for(var obj_variedades in obj_varCul) 
								{
									{
										if(obj_varCul[obj_variedades].key == mListVariedades[keyVar])
										{ 
											//obj.quadra.nome=obj.quadra.nome + ' - ' + obj_varCul[obj_variedades].nome;
											obj['variedade']=obj_varCul[obj_variedades];
											break;
										}
									};
								}
								break;
							}

							var count_usuarios=0;
							var objeto_vistoria={};
							objeto_vistoria.quadra = clone(obj.quadra);
							objeto_vistoria.vistoria=obj.vistoria[mListVariedades[keyVar]];

							percorreVistorias(objeto_vistoria, obj.variedade);
						}
					}
					else //NÃO SEPARA VARIEDADE
					{
						percorreVistorias(obj2, null);
					}

					if($scope.exibirSomenteEn)
					{
						$scope.pragasExibir=$scope.pragasEncontradasGeral;
					}
					else
					{
						$scope.pragasExibir=$scope.todasPragas;
					}

					//FIM-----------DIA---------------------------------------------------------
					$scope.vistorias.sort(compareData);
					$scope.table_pronta=true;
					if(!$scope.$$phase) {
						$scope.$apply();
					}
					

				}
				$('#myPleaseWait').modal('hide');
				return;


			});

		}

	//############################################################################################################################
	//############################################################################################################################
	//LISTA QUADRAS
	//############################################################################################################################

	function atualizaListaQuadras()
	{
		console.log('atualizaListaQuadras');

		if($scope.safra==null) return;
		atualizaVariedade($scope.fazenda.key);

		if($scope.fazenda.quadra==null || $scope.fazenda.quadra.length==0)
		{
			$('#myPleaseWait').modal('hide');
		}

		$scope.quadras=[];
		var baseRef = new Firebase(Constant.Url);
		var refNovo = new Firebase.util.NormalizedCollection(
			[baseRef.child("/filial/"+$scope.fazenda.key+"/safra/"+$scope.safra.key+"/quadra"), "quadraxcul"],
			baseRef.child("/quadra")
			).select(
			{"key":"quadraxcul.$value","alias":"quadraxcultura"},
			{"key":"quadra.$value","alias":"quadra"}
			).ref();

			refNovo.on('child_added', function(snap) {
				

				var obj= snap.val();
				obj.cultura=$scope.getCulturaNome(obj.quadraxcultura.key_cultura)
				$scope.quadras.push(obj);
				$scope.formMapa.quadras.push(obj.quadra);
				if($scope.quadras.length==1)
				{
					atualizaVistorias();
				}

			});				

		}

	//############################################################################################################################
	//############################################################################################################################
	//MAPAS
	//############################################################################################################################


	var contador_anterior=0;
	var contador_correto=0;

	$scope.pragaAnterior=function()
	{
		console.log('pragaAnterior');

		contador_anterior=0;
		$scope.pragasExibir.forEach(function(obj)
		{
			if(obj.key==$scope.formMapa.praga)
			{
				contador_correto=contador_anterior;
			}
			contador_anterior++;
		});
		if($scope.pragasExibir[contador_correto-1]!=null)
		{
			$scope.formMapa.praga=$scope.pragasExibir[contador_correto-1].key;
		}
		if($scope.formMapa.praga!=null)
		{
			$scope.gerarMapa();
		}
	}

	var proximo=false;

	$scope.pragaProxima=function()
	{

		console.log('pragaProxima');

		$scope.pragasExibir.forEach(function(obj)
		{
			if(proximo)
			{
				$scope.formMapa.praga=obj.key;
				proximo=false;
				return true;
			}
			if(obj.key==$scope.formMapa.praga)
			{
				proximo=true;
			}
		});
		if($scope.formMapa.praga!=null)
		{
			$scope.gerarMapa();
		}
	}	

	$scope.resizeMapaInfestacao=function()
	{
		google.maps.event.trigger(map_infestacao, "resize");
		initMapInfestacao(new google.maps.LatLng(-20, -55), 4 );
	}

	$scope.gerarMapa=function()
	{

		console.log('gerarMapa');

		$scope.todascoordenadasQuadraEspecifica2=[];

		if($scope.safra==null)
		{
			$scope.mensagem_aviso = "É preciso selecionar uma safra.";
			$('#modalMensagem').modal('show');
			return true;
		}
		if($scope.formMapa.praga==null)
		{
			$scope.mensagem_aviso = "É preciso selecionar uma praga.";
			$('#modalMensagem').modal('show');
			return true;
		}


		if(heatmap!=null)
		{
			heatmap.setMap(null);
		}

		google.maps.event.trigger(map_infestacao, "resize");

		initMapInfestacao();


			//---------------
			if($scope.formMapa.intesidade==null)
			{
				$scope.formMapa.intesidade=20;
			}
			else
			{
				if($scope.formMapa.intesidade<10)
				{
					$scope.formMapa.intesidade=10
				}
				if($scope.formMapa.intesidade>50)
				{
					$scope.formMapa.intesidade=50;
				}
			}

			if(checkLocalHistoryCompatibilidade())
			{
				window.localStorage.setItem('intensidadeHeatMap', $scope.formMapa.intesidade);
			}
			//---------------

			$scope.todascoordenadasCentroidMapaInfestacao=[];

			$scope.qtde_quadra_coordenadas=0;
			var temQuadra=false;

			$scope.quadras.forEach(function(obj)
			{
				$scope.formMapa.quadras.forEach(function(objSelecionado){
					if(objSelecionado.key==obj.quadra.key && objSelecionado.coordenadas!=null && objSelecionado.coordenadas)
					{
						$scope.qtde_quadra_coordenadas++;
					}
				});			
			});	


			$scope.quadras.forEach(function(obj)
			{
				$scope.formMapa.quadras.forEach(function(objSelecionado){
					if(objSelecionado.key==obj.quadra.key && objSelecionado.coordenadas!=null && objSelecionado.coordenadas)
					{
						temQuadra=true;
						var refCoordenadas = new Firebase(Constant.Url + '/coordenada/'+ obj.quadra.key);
						refCoordenadas.on('value', function(snapshot) {
							if(snapshot.numChildren()>0 )
							{
								atualizaCoordenadasQuadraMapaInfestacao(obj.quadra.key, obj.quadra.nome, snapshot.numChildren());
							}
						});
					}
				});			
			});	


			if(!temQuadra)
			{
				$scope.mensagem_aviso = "É preciso selecionar pelo menos 1 quadra/região.";
				$('#modalMensagem').modal('show');
				return true;
			}
			else
			{
				//$scope.gotoAnchor('map_infestacao');
			}


			listHeat = [];
			$scope.vistorias.forEach(function(vistoria)
			{
				$scope.formMapa.quadras.forEach(function(objSelecionado){
					if(objSelecionado.key==vistoria.quadra.key)
					{
						if(vistoria.quadra.separar_variedade)
						{

						}
						else
						{
							for(var propertyName in vistoria.vistoria) 
							{
							//-----------DIA---------------------------------------------------------
							for(var propertyName_Dia in vistoria.vistoria[propertyName]) 
							{
								//-----------PONTO---------------------------------------------------------
								for(var propertyName_ponto in vistoria.vistoria[propertyName][propertyName_Dia]) 
								{
									for(var propertyName_levantamento in vistoria.vistoria[propertyName][propertyName_Dia][propertyName_ponto]) 
									{
										var vis_fina = vistoria.vistoria[propertyName][propertyName_Dia][propertyName_ponto][propertyName_levantamento];
										
										if($scope.formMapa.praga==vis_fina.key_praga)
										{
											if(vis_fina.latitude!=null && vis_fina.longitude!=null)
											{
												
												/*
												var cityCircle = new google.maps.Circle({
													strokeColor: '#FF0000',
													strokeOpacity: 0.8,
													strokeWeight: 2,
													fillColor: '#FF0000',
													fillOpacity: 0.35 *vis_fina.valor,
													map: map_infestacao,
													center: new google.maps.LatLng(vis_fina.latitude, vis_fina.longitude),
													radius: 2*vis_fina.valor
												});
												*/
												var passo=0;
												for (passo = 0; passo < vis_fina.valor; passo++) 
												{
													

													listHeat.push(new google.maps.LatLng(vis_fina.latitude, vis_fina.longitude)) ;
												}
											}
										}
									}
								}
							}
						}
					}
				}
			});

			});

			heatmap = new google.maps.visualization.HeatmapLayer({
				data: listHeat,
				map: map_infestacao,
				radius: $scope.formMapa.intesidade
			});





		}



		function atualizaCoordenadasQuadraMapaInfestacao(key_quadra, nome_quadra, qdteRegistro)
		{

			console.log('atualizaCoordenadasQuadraMapaInfestacao');

			var todascoordenadasQuadraEspecifica=[];
			var todascoordenadasCentroidQuadraEspecifica=[];

			var refCoordenadas = new Firebase(Constant.Url + '/coordenada/'+ key_quadra);

			var i=0;
			refCoordenadas.on('child_added', function(snap) {
				i++;

				var coordenadas= snap.val();

				var novo=[];
				novo['latitude']=coordenadas.latitude;
				novo['longitude']=coordenadas.longitude;
				todascoordenadasQuadraEspecifica.push(new google.maps.LatLng(coordenadas.latitude, coordenadas.longitude));

				var novoCentroid=[];
				novoCentroid['x']=coordenadas.latitude;
				novoCentroid['y']=coordenadas.longitude;
				$scope.todascoordenadasCentroidMapaInfestacao.push(novoCentroid);
				todascoordenadasCentroidQuadraEspecifica.push(novoCentroid);

				if(qdteRegistro==i)
				{
					$('#myPleaseWait').modal('hide');

					var infowindow = new google.maps.InfoWindow({
						content: nome_quadra
					});

					var region = new Region(todascoordenadasCentroidQuadraEspecifica);	

					if($scope.exibirNomeQuadra)
					{
						var marker = new google.maps.Marker({
							position: new google.maps.LatLng(region.centroid().x, region.centroid().y),
							map: map_infestacao,
							label: '',
							title: nome_quadra
						});
						marker.addListener('click', function() {
							infowindow.open(map_infestacao, marker);
						});
					}
					var objCoo=[];
					objCoo['coordenadas']=todascoordenadasQuadraEspecifica;

					$scope.todascoordenadasQuadraEspecifica2.push(todascoordenadasQuadraEspecifica);
					setaCoordenadasMapaInfestacao($scope.todascoordenadasCentroidMapaInfestacao, todascoordenadasQuadraEspecifica);

				}

			});

			var i=0;	
		}


		function setaCoordenadasMapaInfestacao(todascoordenadasCentroid, todascoordenadasQuadraEspecifica)
		{

			console.log('setaCoordenadasMapaInfestacao');

			if(todascoordenadasCentroid != null && todascoordenadasCentroid.length>0 && todascoordenadasQuadraEspecifica.length>0)
			{	

				setaCentroMapaInfestacao();
				var mundo = [
				{lat: 90, lng:-180},
				{lat: -90, lng: -180},
				{lat: -90, lng: -1},
				{lat: -90, lng: 179},
				{lat:90, lng: 179},

				];

				var worldCoords = [
				new google.maps.LatLng(-80.1054596961173, -170),
				new google.maps.LatLng(80.1054596961173, -170),
				new google.maps.LatLng(80.1054596961173, 170),
				new google.maps.LatLng(-80.1054596961173, 170),
				new google.maps.LatLng(-80.1054596961173, 0)];


				var worldCoordsOri = [
				new google.maps.LatLng(-85.1054596961173, -180),
				new google.maps.LatLng(85.1054596961173, -180),
				new google.maps.LatLng(85.1054596961173, 180),
				new google.maps.LatLng(-85.1054596961173, 180),
				new google.maps.LatLng(-85.1054596961173, 0)];


				var EuropeCoords = [
				new google.maps.LatLng(29.68224948021748, -23.676965750000022),
				new google.maps.LatLng(29.68224948021748, 44.87772174999998),
				new google.maps.LatLng(71.82725578445813, 44.87772174999998),
				new google.maps.LatLng(71.82725578445813, -23.676965750000022)];

				var EuropeCoords2 = [
				new google.maps.LatLng(10.68224948021748, -10.676965750000022),
				new google.maps.LatLng(10.68224948021748, 33.87772174999998),
				new google.maps.LatLng(15.82725578445813, 33.87772174999998),
				new google.maps.LatLng(15.82725578445813, -23.676965750000022)];

				if($scope.todascoordenadasQuadraEspecifica2.length==$scope.qtde_quadra_coordenadas)
				{
					var cords=clone($scope.todascoordenadasQuadraEspecifica2);

					var fillColor='#e6f2ff';
					//var fillColor='#ffffff';
					var strokeColor='#212121';
					var fillOpacity=80;
					var strokeOpacity=0.8;
					var strokeWeight= 3;

					if(cords.length==1)
					{
						var bermudaTriangle = new google.maps.Polygon({
							paths: [ mundo, cords[0]],
						//paths: [cords[0]],
						strokeColor: strokeColor,
						strokeOpacity: strokeOpacity,
						strokeWeight: strokeWeight,
						fillColor: fillColor,
						fillOpacity: fillOpacity
					});
						
						bermudaTriangle.setMap(map_infestacao);
					/*
						var bermudaTriangle2 = new google.maps.Polygon({
						//paths: [ mundo, cords[0]],
						paths: [cords[0]],
						strokeColor: strokeColor,
						strokeOpacity: strokeOpacity,
						strokeWeight: strokeWeight,
						fillColor: fillColor,
						fillOpacity: fillOpacity
					});


						var bounds = new google.maps.LatLngBounds();

						for (var i=0; i < bermudaTriangle2.getPath().getLength(); i++) {
							bounds.extend(bermudaTriangle2.getPath().getAt(i));
						}


						var EuropeCoords3 = [
						new google.maps.LatLng(bounds.getNorthEast().lat(), bounds.getNorthEast().lng()	),
						new google.maps.LatLng(bounds.getSouthWest().lat(), bounds.getNorthEast().lng()	),
						new google.maps.LatLng(bounds.getSouthWest().lat(), bounds.getSouthWest().lng()	),
						new google.maps.LatLng(bounds.getNorthEast().lat(), bounds.getSouthWest().lng()	)];


						var bermudaTriangle3 = new google.maps.Polygon({
							paths: [ mundo, cords[0]],

							strokeColor: strokeColor,
							strokeOpacity: strokeOpacity,
							strokeWeight: strokeWeight,
							fillColor: '#ffffff',
							fillOpacity: fillOpacity
						});
						bermudaTriangle3.setMap(map_infestacao);

						
						//paths: EuropeCoords3,
						var listHeatGeral=[];

						var old_lng=bounds.getSouthWest().lng()+0.0001;	
						var iLgn=0;
						do {

							var old_lat=bounds.getSouthWest().lat()+0.0001;		
							var iLat=0;
							do {
								var point = new google.maps.LatLng(old_lat,old_lng);
								if(google.maps.geometry.poly.containsLocation(point,bermudaTriangle2))
								{

									listHeatGeral.push(point);
								}
								old_lat=old_lat+0.0008;
								iLat=iLat+1;
							}
							while (bounds.getNorthEast().lat()>old_lat)

								old_lng=old_lng +0.0008;
							var point2 = new google.maps.LatLng(old_lat,bounds.getSouthWest().lng());
							iLgn=iLgn+1;

						}
						while (bounds.getNorthEast().lng()>old_lng)

							heatmap = new google.maps.visualization.HeatmapLayer({
								data: listHeatGeral,
								map: map_infestacao,
								radius: $scope.formMapa.intesidade
							});

						var marker1 = new google.maps.Marker({
							position: new google.maps.LatLng(bounds.getNorthEast().lat(), bounds.getNorthEast().lng()	),
							map: map_infestacao,
							label: '',
							title: '1'
						});

						var marker1 = new google.maps.Marker({
							position: new google.maps.LatLng(bounds.getSouthWest().lat(), bounds.getNorthEast().lng()	),
							map: map_infestacao,
							label: '',
							title: '1'
						});

						var marker1 = new google.maps.Marker({
							position: new google.maps.LatLng(bounds.getSouthWest().lat(), bounds.getSouthWest().lng()	),
							map: map_infestacao,
							label: '',
							title: '1'
						});

						var marker1 = new google.maps.Marker({
							position: new google.maps.LatLng(bounds.getNorthEast().lat(), bounds.getSouthWest().lng()	),
							map: map_infestacao,
							label: '',
							title: '1'
						});




				
				A PARTIR DAQUI TAVA COMENTANDO ANTES
				var old_lat=bounds.getSouthWest().lat()+0.0001;			
				for (var i = 0; i < 300; i++) {
					var point = new google.maps.LatLng(old_lat,bounds.getSouthWest().lng());
					if(google.maps.geometry.poly.containsLocation(point,bermudaTriangle))
					{
						var marker11 = new google.maps.Marker({
							position: new google.maps.LatLng(old_lat, bounds.getSouthWest().lng()	),
							map: map_infestacao,
							label: '',
							title: '1'
						});
					}
					old_lat=old_lat+0.0001;
				}



				for (var i = 0; i < 300; i++) {
					var point = new google.maps.LatLng(old_lat,bounds.getSouthWest().lng());
					if (google.maps.geometry.poly.containsLocation(point,bermudaTriangle)) {
						var marker11 = new google.maps.Marker({
							position: new google.maps.LatLng(old_lat, bounds.getSouthWest().lng()	),
							map: map_infestacao,
							label: '',
							title: '1'
						});
					}
					old_lat=old_lat+0.0001;
				}

				old_lat=bounds.getSouthWest().lat()+0.0001;
				var old_lng=bounds.getSouthWest().lng()+0.0001;
				for (var i = 0; i < 300; i++) {
					var point = new google.maps.LatLng(old_lat,old_lng);
					if (google.maps.geometry.poly.containsLocation(point,bermudaTriangle)) {
						var marker11 = new google.maps.Marker({
							position: new google.maps.LatLng(old_lat, old_lng	),
							map: map_infestacao,
							label: '',
							title: '1'
						});
					}
					old_lat=old_lat+0.0001;
					old_lng=old_lng+0.0001;
				}

				var marker1 = new google.maps.Marker({
					position: new google.maps.LatLng(bounds.getSouthWest().lat(), bounds.getSouthWest().lng()	),
					map: map_infestacao,
					label: '',
					title: '1'
				});
				marker1.addListener('click', function() {
					infowindow.open(map_infestacao, marker1);
				});

				var marker = new google.maps.Marker({
					position: new google.maps.LatLng(bounds.getSouthWest().lat()+0.001, bounds.getSouthWest().lng()	),
					map: map_infestacao,
					label: '',
					title: '1'
				});
				marker.addListener('click', function() {
					infowindow.open(map_infestacao, marker);
				});

				var marker2 = new google.maps.Marker({
					position: new google.maps.LatLng(bounds.getNorthEast().lat(), bounds.getNorthEast().lng()	),
					map: map_infestacao,
					label: '',
					title: '2'
				});
				marker2.addListener('click', function() {
					infowindow.open(map_infestacao, marker2);
				});
				*/
			}
			if(cords.length==2)
			{
				var bermudaTriangle = new google.maps.Polygon({
					paths: [ mundo, 
					cords[0],
					cords[1]
					],
					strokeColor: strokeColor,
					strokeOpacity: strokeOpacity,
					strokeWeight: strokeWeight,
					fillColor: fillColor,
					fillOpacity: fillOpacity
				});

				bermudaTriangle.setMap(map_infestacao);
			}
			if(cords.length==3)
			{
				var bermudaTriangle = new google.maps.Polygon({
					paths: [ mundo, 
					cords[0],
					cords[1],
					cords[2]
					],
					strokeColor: strokeColor,
					strokeOpacity: strokeOpacity,
					strokeWeight: strokeWeight,
					fillColor: fillColor,
					fillOpacity: fillOpacity
				});

				bermudaTriangle.setMap(map_infestacao);
			}
			if(cords.length==4)
			{
				var bermudaTriangle = new google.maps.Polygon({
					paths: [ mundo, 
					cords[0],
					cords[1],
					cords[2],
					cords[3]
					],
					strokeColor: strokeColor,
					strokeOpacity: strokeOpacity,
					strokeWeight: strokeWeight,
					fillColor: fillColor,
					fillOpacity: fillOpacity
				});

				bermudaTriangle.setMap(map_infestacao);
			}
			if(cords.length==5)
			{
				var bermudaTriangle = new google.maps.Polygon({
					paths: [ mundo, 
					cords[0],
					cords[1],
					cords[2],
					cords[3],
					cords[4]
					],
					strokeColor: strokeColor,
					strokeOpacity: strokeOpacity,
					strokeWeight: strokeWeight,
					fillColor: fillColor,
					fillOpacity: fillOpacity
				});

				bermudaTriangle.setMap(map_infestacao);
			}
			if(cords.length==6)
			{
				var bermudaTriangle = new google.maps.Polygon({
					paths: [ mundo, 
					cords[0],
					cords[1],
					cords[2],
					cords[3],
					cords[4],
					cords[5]
					],
					strokeColor: strokeColor,
					strokeOpacity: strokeOpacity,
					strokeWeight: strokeWeight,
					fillColor: fillColor,
					fillOpacity: fillOpacity
				});

				bermudaTriangle.setMap(map_infestacao);
			}
			if(cords.length==7)
			{
				var bermudaTriangle = new google.maps.Polygon({
					paths: [ mundo, 
					cords[0],
					cords[1],
					cords[2],
					cords[3],
					cords[4],
					cords[5],
					cords[6]
					],
					strokeColor: strokeColor,
					strokeOpacity: strokeOpacity,
					strokeWeight: strokeWeight,
					fillColor: fillColor,
					fillOpacity: fillOpacity
				});

				bermudaTriangle.setMap(map_infestacao);
			}
			if(cords.length==8)
			{
				var bermudaTriangle = new google.maps.Polygon({
					paths: [ mundo, 
					cords[0],
					cords[1],
					cords[2],
					cords[3],
					cords[4],
					cords[5],
					cords[6],
					cords[7]
					],
					strokeColor: strokeColor,
					strokeOpacity: strokeOpacity,
					strokeWeight: strokeWeight,
					fillColor: fillColor,
					fillOpacity: fillOpacity
				});

				bermudaTriangle.setMap(map_infestacao);
			}
			if(cords.length==9)
			{
				var bermudaTriangle = new google.maps.Polygon({
					paths: [ mundo, 
					cords[0],
					cords[1],
					cords[2],
					cords[3],
					cords[4],
					cords[5],
					cords[6],
					cords[7],
					cords[8]
					],
					strokeColor: strokeColor,
					strokeOpacity: strokeOpacity,
					strokeWeight: strokeWeight,
					fillColor: fillColor,
					fillOpacity: fillOpacity
				});

				bermudaTriangle.setMap(map_infestacao);
			}

			if(cords.length==10)
			{
				var bermudaTriangle = new google.maps.Polygon({
					paths: [ mundo, 
					cords[0],
					cords[1],
					cords[2],
					cords[3],
					cords[4],
					cords[5],
					cords[6],
					cords[7],
					cords[8],
					cords[9]
					],
					strokeColor: strokeColor,
					strokeOpacity: strokeOpacity,
					strokeWeight: strokeWeight,
					fillColor: fillColor,
					fillOpacity: fillOpacity
				});

				bermudaTriangle.setMap(map_infestacao);
			}

			if(cords.length==11)
			{
				var bermudaTriangle = new google.maps.Polygon({
					paths: [ mundo, 
					cords[0],
					cords[1],
					cords[2],
					cords[3],
					cords[4],
					cords[5],
					cords[6],
					cords[7],
					cords[8],
					cords[9],
					cords[10]
					],
					strokeColor: strokeColor,
					strokeOpacity: strokeOpacity,
					strokeWeight: strokeWeight,
					fillColor: fillColor,
					fillOpacity: fillOpacity
				});

				bermudaTriangle.setMap(map_infestacao);
			}
			if(cords.length==12)
			{
				var bermudaTriangle = new google.maps.Polygon({
					paths: [ mundo, 
					cords[0],
					cords[1],
					cords[2],
					cords[3],
					cords[4],
					cords[5],
					cords[6],
					cords[7],
					cords[8],
					cords[9],
					cords[10],
					cords[11]
					],
					strokeColor: strokeColor,
					strokeOpacity: strokeOpacity,
					strokeWeight: strokeWeight,
					fillColor: fillColor,
					fillOpacity: fillOpacity
				});

				bermudaTriangle.setMap(map_infestacao);
			}
			if(cords.length==13)
			{
				var bermudaTriangle = new google.maps.Polygon({
					paths: [ mundo, 
					cords[0],
					cords[1],
					cords[2],
					cords[3],
					cords[4],
					cords[5],
					cords[6],
					cords[7],
					cords[8],
					cords[9],
					cords[10],
					cords[11],
					cords[12]
					],
					strokeColor: strokeColor,
					strokeOpacity: strokeOpacity,
					strokeWeight: strokeWeight,
					fillColor: fillColor,
					fillOpacity: fillOpacity
				});

				bermudaTriangle.setMap(map_infestacao);
			}
			if(cords.length==14)
			{
				var bermudaTriangle = new google.maps.Polygon({
					paths: [ mundo, 
					cords[0],
					cords[1],
					cords[2],
					cords[3],
					cords[4],
					cords[5],
					cords[6],
					cords[7],
					cords[8],
					cords[9],
					cords[10],
					cords[11],
					cords[12],
					cords[13]
					],
					strokeColor: strokeColor,
					strokeOpacity: strokeOpacity,
					strokeWeight: strokeWeight,
					fillColor: fillColor,
					fillOpacity: fillOpacity
				});

				bermudaTriangle.setMap(map_infestacao);
			}
			if(cords.length==15)
			{
				var bermudaTriangle = new google.maps.Polygon({
					paths: [ mundo, 
					cords[0],
					cords[1],
					cords[2],
					cords[3],
					cords[4],
					cords[5],
					cords[6],
					cords[7],
					cords[8],
					cords[9],
					cords[10],
					cords[11],
					cords[12],
					cords[13],
					cords[14]
					],
					strokeColor: strokeColor,
					strokeOpacity: strokeOpacity,
					strokeWeight: strokeWeight,
					fillColor: fillColor,
					fillOpacity: fillOpacity
				});

				bermudaTriangle.setMap(map_infestacao);
			}

			if(cords.length==16)
			{
				var bermudaTriangle = new google.maps.Polygon({
					paths: [ mundo, 
					cords[0],
					cords[1],
					cords[2],
					cords[3],
					cords[4],
					cords[5],
					cords[6],
					cords[7],
					cords[8],
					cords[9],
					cords[10],
					cords[11],
					cords[12],
					cords[13],
					cords[14],
					cords[15]
					],
					strokeColor: strokeColor,
					strokeOpacity: strokeOpacity,
					strokeWeight: strokeWeight,
					fillColor: fillColor,
					fillOpacity: fillOpacity
				});

				bermudaTriangle.setMap(map_infestacao);
			}
			if(cords.length==17)
			{
				var bermudaTriangle = new google.maps.Polygon({
					paths: [ mundo, 
					cords[0],
					cords[1],
					cords[2],
					cords[3],
					cords[4],
					cords[5],
					cords[6],
					cords[7],
					cords[8],
					cords[9],
					cords[10],
					cords[11],
					cords[12],
					cords[13],
					cords[14],
					cords[15],
					cords[16]
					],
					strokeColor: strokeColor,
					strokeOpacity: strokeOpacity,
					strokeWeight: strokeWeight,
					fillColor: fillColor,
					fillOpacity: fillOpacity
				});

				bermudaTriangle.setMap(map_infestacao);
			}
			if(cords.length==18)
			{
				var bermudaTriangle = new google.maps.Polygon({
					paths: [ mundo, 
					cords[0],
					cords[1],
					cords[2],
					cords[3],
					cords[4],
					cords[5],
					cords[6],
					cords[7],
					cords[8],
					cords[9],
					cords[10],
					cords[11],
					cords[12],
					cords[13],
					cords[14],
					cords[15],
					cords[16],
					cords[17]
					],
					strokeColor: strokeColor,
					strokeOpacity: strokeOpacity,
					strokeWeight: strokeWeight,
					fillColor: fillColor,
					fillOpacity: fillOpacity
				});

				bermudaTriangle.setMap(map_infestacao);
			}
			if(cords.length==19)
			{
				var bermudaTriangle = new google.maps.Polygon({
					paths: [ mundo, 
					cords[0],
					cords[1],
					cords[2],
					cords[3],
					cords[4],
					cords[5],
					cords[6],
					cords[7],
					cords[8],
					cords[9],
					cords[10],
					cords[11],
					cords[12],
					cords[13],
					cords[14],
					cords[15],
					cords[16],
					cords[17],
					cords[18]
					],
					strokeColor: strokeColor,
					strokeOpacity: strokeOpacity,
					strokeWeight: strokeWeight,
					fillColor: fillColor,
					fillOpacity: fillOpacity
				});

				bermudaTriangle.setMap(map_infestacao);
			}
			if(cords.length==20)
			{
				var bermudaTriangle = new google.maps.Polygon({
					paths: [ mundo, 
					cords[0],
					cords[1],
					cords[2],
					cords[3],
					cords[4],
					cords[5],
					cords[6],
					cords[7],
					cords[8],
					cords[9],
					cords[10],
					cords[11],
					cords[12],
					cords[13],
					cords[14],
					cords[15],
					cords[16],
					cords[17],
					cords[18],
					cords[19]
					],
					strokeColor: strokeColor,
					strokeOpacity: strokeOpacity,
					strokeWeight: strokeWeight,
					fillColor: fillColor,
					fillOpacity: fillOpacity
				});

				bermudaTriangle.setMap(map_infestacao);
			}
			if(cords.length==21)
			{
				var bermudaTriangle = new google.maps.Polygon({
					paths: [ mundo, 
					cords[0],
					cords[1],
					cords[2],
					cords[3],
					cords[4],
					cords[5],
					cords[6],
					cords[7],
					cords[8],
					cords[9],
					cords[10],
					cords[11],
					cords[12],
					cords[13],
					cords[14],
					cords[15],
					cords[16],
					cords[17],
					cords[18],
					cords[19],
					cords[20]
					],
					strokeColor: strokeColor,
					strokeOpacity: strokeOpacity,
					strokeWeight: strokeWeight,
					fillColor: fillColor,
					fillOpacity: fillOpacity
				});

				bermudaTriangle.setMap(map_infestacao);
			}
			if(cords.length==22)
			{
				var bermudaTriangle = new google.maps.Polygon({
					paths: [ mundo, 
					cords[0],
					cords[1],
					cords[2],
					cords[3],
					cords[4],
					cords[5],
					cords[6],
					cords[7],
					cords[8],
					cords[9],
					cords[10],
					cords[11],
					cords[12],
					cords[13],
					cords[14],
					cords[15],
					cords[16],
					cords[17],
					cords[18],
					cords[19],
					cords[20],
					cords[21]
					],
					strokeColor: strokeColor,
					strokeOpacity: strokeOpacity,
					strokeWeight: strokeWeight,
					fillColor: fillColor,
					fillOpacity: fillOpacity
				});

				bermudaTriangle.setMap(map_infestacao);
			}

		}



	}
	else
	{
		var todascoordenadasCentroidQuadraEspecifica=[];

		var region = new Region(todascoordenadasCentroidQuadraEspecifica);			
		$scope.centerMapa=new google.maps.LatLng(region.centroid().x, region.centroid().y);
	}

	if(!$scope.$$phase) 
	{
		$scope.$apply();
	}

	$('#myPleaseWait').modal('hide');
}

function setaCentroMapaInfestacao()
{
	var region = new Region($scope.todascoordenadasCentroidMapaInfestacao);	
	map_infestacao.setCenter(new google.maps.LatLng(region.centroid().x, region.centroid().y))	;
	map_infestacao.setZoom(12);	
}

$scope.abrirMapa = function(vistoria) {
	//if(!$('#myPleaseWait').hasClass('in')){ $('#myPleaseWait').modal('show')};

	var refCoordenadas = new Firebase(Constant.Url + '/coordenada/'+ vistoria.quadra.key);
	refCoordenadas.on('value', function(snapshot) {
		if(snapshot.numChildren()>0)
		{
			atualizaCoordenadasQuadra(vistoria,  snapshot.numChildren());
		}
		else
		{
			setaCoordenadasPontos(vistoria, null, null);
		}

	});
}

function atualizaCoordenadasQuadra(vistoria, qdteRegistro)
{
	console.log('atualizaCoordenadasQuadra');

	var todascoordenadasQuadraEspecifica=[];
	var todascoordenadasCentroidQuadraEspecifica=[];

	var refCoordenadas = new Firebase(Constant.Url + '/coordenada/'+ vistoria.quadra.key);

	var i=0;
	refCoordenadas.on('child_added', function(snap) {
		i++;


		var coordenadas= snap.val();

		var novo=[];
		novo['latitude']=coordenadas.latitude;
		novo['longitude']=coordenadas.longitude;
		todascoordenadasQuadraEspecifica.push(new google.maps.LatLng(coordenadas.latitude, coordenadas.longitude));


		var novoCentroid=[];
		novoCentroid['x']=coordenadas.latitude;
		novoCentroid['y']=coordenadas.longitude;
		todascoordenadasCentroidQuadraEspecifica.push(novoCentroid);

		if(qdteRegistro==i)
		{
			$('#myPleaseWait').modal('hide');
			setaCoordenadasPontos(vistoria, todascoordenadasCentroidQuadraEspecifica, todascoordenadasQuadraEspecifica);

		}

	});

	var i=0;	
}

function setaCoordenadasPontos(vistoria, todascoordenadasCentroid, todascoordenadasQuadraEspecifica)
{
	console.log('setaCoordenadasPontos');

	if(todascoordenadasCentroid != null && todascoordenadasCentroid.length>0 && todascoordenadasQuadraEspecifica.length>0)
	{
		var region = new Region(todascoordenadasCentroid);			
		$scope.centerMapa=new google.maps.LatLng(region.centroid().x, region.centroid().y);
		initMap(new google.maps.LatLng(region.centroid().x, region.centroid().y), 14);
		$('#modalMapa').modal('show');


		var bermudaTriangle = new google.maps.Polygon({
			paths: todascoordenadasQuadraEspecifica,
			strokeColor: '#212121',
			strokeOpacity: 0.8,
			strokeWeight: 3,
			fillColor: '#50b300',
			fillOpacity: 0.90
		});
		bermudaTriangle.setMap(map);
	}
	else
	{
		var todascoordenadasCentroidQuadraEspecifica=[];
		for(var x in vistoria.listPontos )
		{
			var novoCentroid=[];
			novoCentroid['x']=vistoria.listPontos[x].latitude;
			novoCentroid['y']=vistoria.listPontos[x].longitude;
			todascoordenadasCentroidQuadraEspecifica.push(novoCentroid);				
		}

		var region = new Region(todascoordenadasCentroidQuadraEspecifica);			
		$scope.centerMapa=new google.maps.LatLng(region.centroid().x, region.centroid().y);
		initMap(new google.maps.LatLng(region.centroid().x, region.centroid().y), 14);		
		$('#modalMapa').modal('show');
	}

	for(var x in vistoria.listPontos )
	{
		var marker = new google.maps.Marker({
			position: new google.maps.LatLng(vistoria.listPontos[x].latitude, vistoria.listPontos[x].longitude),
			map: map,
			label: ''+vistoria.listPontos[x].ponto
		});
	}

	if(!$scope.$$phase) 
	{
		$scope.$apply();
	}

	$('#myPleaseWait').modal('hide');
}

$scope.efetuaSelecionarTodasQuadras = function()
{
	console.log('efetuaSelecionarTodasQuadras');
	$scope.selecionarTodasQuadras=true;
	$scope.quadras.forEach(function(obj){
		$scope.formMapa.quadras.push(obj.quadra);
	});		
}

$scope.DesEfetuaSelecionarTodasQuadras= function()
{
	console.log('DesEfetuaSelecionarTodasQuadras');

	$scope.selecionarTodasQuadras=false;
	$scope.formMapa.quadras=[];
}

$scope.clickQuadras = function()
{

	console.log('clickQuadras');

	$scope.selecionarTodasQuadras=false;;
}

$scope.setaExibirSomenteEncontradas = function()
{

	console.log('setaExibirSomenteEncontradas');

	if($scope.exibirSomenteEn)
	{
		if(checkLocalHistoryCompatibilidade())
		{
			window.localStorage.setItem('exibirSomentePragasEncontradas', 'S');
		}
		$scope.pragasExibir=$scope.pragasEncontradasGeral;
	}
	else
	{
		if(checkLocalHistoryCompatibilidade())
		{
			window.localStorage.setItem('exibirSomentePragasEncontradas', 'N');
		}
		$scope.pragasExibir=$scope.todasPragas;
	}
}


$scope.setaExibirNomeQuadras = function()
{

	console.log('setaExibirNomeQuadras');

	if($scope.exibirNomeQuadra)
	{
		if(checkLocalHistoryCompatibilidade())
		{
			window.localStorage.setItem('exibirNomeQuadra', 'S');
		}
	}
	else
	{
		if(checkLocalHistoryCompatibilidade())
		{
			window.localStorage.setItem('exibirNomeQuadra', 'N');
		}
	}
	$scope.gerarMapa();
}
//############################################################################################################################
//############################################################################################################################
//RECUPERA NOME QUADRA/CULTURA
//############################################################################################################################
$scope.getCulturaNome = function(culturaId){
	var retorno = '';
	$scope.culturas.forEach(function(item){
		if(item.key === culturaId) retorno = item.nome;
	});
	return retorno;
};

$scope.getQuadraNome = function(quadraId){
	var retorno = '';
	$scope.quadras.forEach(function(item){
		if(item.$id === quadraId) retorno = item.nome;
	});
	return retorno;
};


		//############################################################################################################################
		//############################################################################################################################
		//UTILIZADES
		//############################################################################################################################



		function formatDate(date) {
			var d = new Date(date),
			month = '' + (d.getMonth() + 1),
			day = '' + d.getDate(),
			year = d.getFullYear();

			if (month.length < 2) month = '0' + month;
			if (day.length < 2) day = '0' + day;

			return [day, month, year].join('/');
		}

		function clone(obj) {
			if (null == obj || "object" != typeof obj) return obj;
			var copy = obj.constructor();
			for (var attr in obj) {
				if (obj.hasOwnProperty(attr)) copy[attr] = obj[attr];
			}
			return copy;
		}

		function compare(a,b) {
			if (a.nome_praga < b.nome_praga)
				return -1;
			if (a.nome_praga > b.nome_praga)
				return 1;

			if (a.key_tamanho < b.key_tamanho)
				return -1;
			if (a.key_tamanho > b.key_tamanho)
				return 1;
			return 0;
		}

		function compareData(a,b) {
			if (a.dataMilis > b.dataMilis)
				return -1;
			if (a.dataMilis < b.dataMilis)
				return 1;

			return 0;
		}

		$scope.diferencaData = function(a,b)
		{

			var date1 = new Date(a);
			var date2 = new Date(b);
			var timeDiff = Math.abs(date2.getTime() - date1.getTime());
			var  resultado= Math.ceil(timeDiff / (24 * 60 * 60 * 1000));
			if(resultado<0 || isNaN(resultado))
			{
				return 0;
			}
			else
			{
				return resultado -1
			}
		}

		$scope.logout = function(){
			var ref = new Firebase(Constant.Url);
			ref.unauth();
			window.location.href = '/login';
		}

		function checkLocalHistoryCompatibilidade(){
			var test = 'test';
			try {
				localStorage.setItem(test, test);
				localStorage.removeItem(test);
				return true;
			} catch(e) {
				return false;
			}
		}



		//UTILIZADES MAPA
		//############################################################################################################################
		
		$('#modalMapa').on('shown.bs.modal', function () {
			google.maps.event.trigger(map, "resize");
			map.setCenter($scope.centerMapa);
		});

		function initMap(center, zoom){

			var mapOptions = {
				zoom: zoom,
				center: center,
				mapTypeId: google.maps.MapTypeId.HYBRID
			}

			var mapOptions2 = {
				zoom: zoom,
				center: center,
				mapTypeId: 'terrain'
			}

			map = new google.maps.Map(document.getElementById('map'), mapOptions);

			map_infestacao = new google.maps.Map(document.getElementById('map_infestacao'), mapOptions2);
		};

		function initMapInfestacao(center, zoom){

			var mapOptions = {
				center: center,
				mapTypeId: 'terrain',
				styles : [
				{
					"elementType": "geometry",
					"stylers": [
					{
						"color": "#f5f5f5"
					}
					]
				},
				{
					"elementType": "labels.icon",
					"stylers": [
					{
						"visibility": "off"
					}
					]
				},
				{
					"elementType": "labels.text.fill",
					"stylers": [
					{
						"color": "#616161"
					}
					]
				},
				{
					"elementType": "labels.text.stroke",
					"stylers": [
					{
						"color": "#f5f5f5"
					}
					]
				},
				{
					"featureType": "administrative.land_parcel",
					"elementType": "labels.text.fill",
					"stylers": [
					{
						"color": "#bdbdbd"
					}
					]
				},
				{
					"featureType": "poi",
					"elementType": "geometry",
					"stylers": [
					{
						"color": "#eeeeee"
					}
					]
				},
				{
					"featureType": "poi",
					"elementType": "labels.text.fill",
					"stylers": [
					{
						"color": "#757575"
					}
					]
				},
				{
					"featureType": "poi.park",
					"elementType": "geometry",
					"stylers": [
					{
						"color": "#e5e5e5"
					}
					]
				},
				{
					"featureType": "poi.park",
					"elementType": "labels.text.fill",
					"stylers": [
					{
						"color": "#9e9e9e"
					}
					]
				},
				{
					"featureType": "road",
					"elementType": "geometry",
					"stylers": [
					{
						"color": "#ffffff"
					}
					]
				},
				{
					"featureType": "road.arterial",
					"elementType": "labels.text.fill",
					"stylers": [
					{
						"color": "#757575"
					}
					]
				},
				{
					"featureType": "road.highway",
					"elementType": "geometry",
					"stylers": [
					{
						"color": "#dadada"
					}
					]
				},
				{
					"featureType": "road.highway",
					"elementType": "labels.text.fill",
					"stylers": [
					{
						"color": "#616161"
					}
					]
				},
				{
					"featureType": "road.local",
					"elementType": "labels.text.fill",
					"stylers": [
					{
						"color": "#9e9e9e"
					}
					]
				},
				{
					"featureType": "transit.line",
					"elementType": "geometry",
					"stylers": [
					{
						"color": "#e5e5e5"
					}
					]
				},
				{
					"featureType": "transit.station",
					"elementType": "geometry",
					"stylers": [
					{
						"color": "#eeeeee"
					}
					]
				},
				{
					"featureType": "water",
					"elementType": "geometry",
					"stylers": [
					{
						"color": "#c9c9c9"
					}
					]
				},
				{
					"featureType": "water",
					"elementType": "labels.text.fill",
					"stylers": [
					{
						"color": "#9e9e9e"
					}
					]
				}
				]
			}


			map_infestacao = new google.maps.Map(document.getElementById('map_infestacao'), mapOptions);
		};

		function castObjToArray(myObj)
		{
			if(myObj==null)
			{
				var sem_nada=[];
				return sem_nada;
			}
			else
			{
				var array = $.map(myObj, function(value, index) {
					return [value];
				});
				return array;

			}
		}

		atualizaListaFiliais();
		atualizaCulturas();
		atualizaUsuarios();


		function Point(x, y) {
			this.x = x;
			this.y = y;
		}

		function Region(points) {
			this.points = points || [];
			this.length = points.length;
		}

		Region.prototype.area = function () {
			var area = 0,
			i,
			j,
			point1,
			point2;

			for (i = 0, j = this.length - 1; i < this.length; j = i, i += 1) {
				point1 = this.points[i];
				point2 = this.points[j];
				area += point1.x * point2.y;
				area -= point1.y * point2.x;
			}
			area /= 2;

			return area;
		};

		Region.prototype.centroid = function () {
			var x = 0,
			y = 0,
			i,
			j,
			f,
			point1,
			point2;

			for (i = 0, j = this.length - 1; i < this.length; j = i, i += 1) {
				point1 = this.points[i];
				point2 = this.points[j];
				f = point1.x * point2.y - point2.x * point1.y;
				x += (point1.x + point2.x) * f;
				y += (point1.y + point2.y) * f;
			}

			f = this.area() * 6;

			return new Point(x / f, y / f);
		};

		initMap(new google.maps.LatLng(-20, -55), 4 );

		var styles = {
			default: null,
			silver: [
			{
				elementType: 'geometry',
				stylers: [{color: '#f5f5f5'}]
			},
			{
				elementType: 'labels.icon',
				stylers: [{visibility: 'off'}]
			},
			{
				elementType: 'labels.text.fill',
				stylers: [{color: '#616161'}]
			},
			{
				elementType: 'labels.text.stroke',
				stylers: [{color: '#f5f5f5'}]
			},
			{
				featureType: 'administrative.land_parcel',
				elementType: 'labels.text.fill',
				stylers: [{color: '#bdbdbd'}]
			},
			{
				featureType: 'poi',
				elementType: 'geometry',
				stylers: [{color: '#eeeeee'}]
			},
			{
				featureType: 'poi',
				elementType: 'labels.text.fill',
				stylers: [{color: '#757575'}]
			},
			{
				featureType: 'poi.park',
				elementType: 'geometry',
				stylers: [{color: '#e5e5e5'}]
			},
			{
				featureType: 'poi.park',
				elementType: 'labels.text.fill',
				stylers: [{color: '#9e9e9e'}]
			},
			{
				featureType: 'road',
				elementType: 'geometry',
				stylers: [{color: '#ffffff'}]
			},
			{
				featureType: 'road.arterial',
				elementType: 'labels.text.fill',
				stylers: [{color: '#757575'}]
			},
			{
				featureType: 'road.highway',
				elementType: 'geometry',
				stylers: [{color: '#dadada'}]
			},
			{
				featureType: 'road.highway',
				elementType: 'labels.text.fill',
				stylers: [{color: '#616161'}]
			},
			{
				featureType: 'road.local',
				elementType: 'labels.text.fill',
				stylers: [{color: '#9e9e9e'}]
			},
			{
				featureType: 'transit.line',
				elementType: 'geometry',
				stylers: [{color: '#e5e5e5'}]
			},
			{
				featureType: 'transit.station',
				elementType: 'geometry',
				stylers: [{color: '#eeeeee'}]
			},
			{
				featureType: 'water',
				elementType: 'geometry',
				stylers: [{color: '#c9c9c9'}]
			},
			{
				featureType: 'water',
				elementType: 'labels.text.fill',
				stylers: [{color: '#9e9e9e'}]
			}
			],

			night: [
			{elementType: 'geometry', stylers: [{color: '#242f3e'}]},
			{elementType: 'labels.text.stroke', stylers: [{color: '#242f3e'}]},
			{elementType: 'labels.text.fill', stylers: [{color: '#746855'}]},
			{
				featureType: 'administrative.locality',
				elementType: 'labels.text.fill',
				stylers: [{color: '#d59563'}]
			},
			{
				featureType: 'poi',
				elementType: 'labels.text.fill',
				stylers: [{color: '#d59563'}]
			},
			{
				featureType: 'poi.park',
				elementType: 'geometry',
				stylers: [{color: '#263c3f'}]
			},
			{
				featureType: 'poi.park',
				elementType: 'labels.text.fill',
				stylers: [{color: '#6b9a76'}]
			},
			{
				featureType: 'road',
				elementType: 'geometry',
				stylers: [{color: '#38414e'}]
			},
			{
				featureType: 'road',
				elementType: 'geometry.stroke',
				stylers: [{color: '#212a37'}]
			},
			{
				featureType: 'road',
				elementType: 'labels.text.fill',
				stylers: [{color: '#9ca5b3'}]
			},
			{
				featureType: 'road.highway',
				elementType: 'geometry',
				stylers: [{color: '#746855'}]
			},
			{
				featureType: 'road.highway',
				elementType: 'geometry.stroke',
				stylers: [{color: '#1f2835'}]
			},
			{
				featureType: 'road.highway',
				elementType: 'labels.text.fill',
				stylers: [{color: '#f3d19c'}]
			},
			{
				featureType: 'transit',
				elementType: 'geometry',
				stylers: [{color: '#2f3948'}]
			},
			{
				featureType: 'transit.station',
				elementType: 'labels.text.fill',
				stylers: [{color: '#d59563'}]
			},
			{
				featureType: 'water',
				elementType: 'geometry',
				stylers: [{color: '#17263c'}]
			},
			{
				featureType: 'water',
				elementType: 'labels.text.fill',
				stylers: [{color: '#515c6d'}]
			},
			{
				featureType: 'water',
				elementType: 'labels.text.stroke',
				stylers: [{color: '#17263c'}]
			}
			],

			retro: [
			{elementType: 'geometry', stylers: [{color: '#ebe3cd'}]},
			{elementType: 'labels.text.fill', stylers: [{color: '#523735'}]},
			{elementType: 'labels.text.stroke', stylers: [{color: '#f5f1e6'}]},
			{
				featureType: 'administrative',
				elementType: 'geometry.stroke',
				stylers: [{color: '#c9b2a6'}]
			},
			{
				featureType: 'administrative.land_parcel',
				elementType: 'geometry.stroke',
				stylers: [{color: '#dcd2be'}]
			},
			{
				featureType: 'administrative.land_parcel',
				elementType: 'labels.text.fill',
				stylers: [{color: '#ae9e90'}]
			},
			{
				featureType: 'landscape.natural',
				elementType: 'geometry',
				stylers: [{color: '#dfd2ae'}]
			},
			{
				featureType: 'poi',
				elementType: 'geometry',
				stylers: [{color: '#dfd2ae'}]
			},
			{
				featureType: 'poi',
				elementType: 'labels.text.fill',
				stylers: [{color: '#93817c'}]
			},
			{
				featureType: 'poi.park',
				elementType: 'geometry.fill',
				stylers: [{color: '#a5b076'}]
			},
			{
				featureType: 'poi.park',
				elementType: 'labels.text.fill',
				stylers: [{color: '#447530'}]
			},
			{
				featureType: 'road',
				elementType: 'geometry',
				stylers: [{color: '#f5f1e6'}]
			},
			{
				featureType: 'road.arterial',
				elementType: 'geometry',
				stylers: [{color: '#fdfcf8'}]
			},
			{
				featureType: 'road.highway',
				elementType: 'geometry',
				stylers: [{color: '#f8c967'}]
			},
			{
				featureType: 'road.highway',
				elementType: 'geometry.stroke',
				stylers: [{color: '#e9bc62'}]
			},
			{
				featureType: 'road.highway.controlled_access',
				elementType: 'geometry',
				stylers: [{color: '#e98d58'}]
			},
			{
				featureType: 'road.highway.controlled_access',
				elementType: 'geometry.stroke',
				stylers: [{color: '#db8555'}]
			},
			{
				featureType: 'road.local',
				elementType: 'labels.text.fill',
				stylers: [{color: '#806b63'}]
			},
			{
				featureType: 'transit.line',
				elementType: 'geometry',
				stylers: [{color: '#dfd2ae'}]
			},
			{
				featureType: 'transit.line',
				elementType: 'labels.text.fill',
				stylers: [{color: '#8f7d77'}]
			},
			{
				featureType: 'transit.line',
				elementType: 'labels.text.stroke',
				stylers: [{color: '#ebe3cd'}]
			},
			{
				featureType: 'transit.station',
				elementType: 'geometry',
				stylers: [{color: '#dfd2ae'}]
			},
			{
				featureType: 'water',
				elementType: 'geometry.fill',
				stylers: [{color: '#b9d3c2'}]
			},
			{
				featureType: 'water',
				elementType: 'labels.text.fill',
				stylers: [{color: '#92998d'}]
			}
			],

			hiding: [
			{
				featureType: 'poi.business',
				stylers: [{visibility: 'off'}]
			},
			{
				featureType: 'transit',
				elementType: 'labels.icon',
				stylers: [{visibility: 'off'}]
			}
			]
		};

	}




}());
/**
 * Navegacao entre itens de tabela.
 * Requer os seletores dos itens navegaveis e eixos permitidos.
 * O id dos itens navegaveis deve ter formato p[c][_l]
 * Onde: p -> prefixo, c -> coluna, l -> linha
 * @param selectors Seletores CSS
 * @param vAxis 
 * @param hAxis
 */
function ativaNavegacao(selectors, vAxis, hAxis) {
	$(selectors).on(
		'keydown',
		function(event) {
			var key = event.keyCode;
			if (key < 37 || key > 40) {
				return;
			}

			var origin = this.id;
			var prefixo = origin.charAt(0);
			var idParts = origin.split('_');
			var position = [ Number(idParts[0].replace(prefixo, '')), Number(idParts[1]) ];

			if (position[0] == 0) {
				position[0] = '';
				hAxis = false;
			}

			if (position[1] == 0) {
				position[1] = '';
				vAxis = false;
			}

			switch (key) {
				case 37:
				case 39:
					if (hAxis) {
						position[0] = (key == 37 ? position[0] - 1 : position[0] + 1);
					}
					else {
						return;
					}
					break;
				case 38:
				case 40:
					if (vAxis) {
						position[1] = (key == 38 ? position[1] - 1 : position[1] + 1);
					}
					else {
						return;
					}
					break;
			}

			origin = $('#' + origin);
			var destination = $('#' + prefixo + position[0] + '_' + position[1]);

			if (destination[0] != null) {
				origin.trigger("blur");
				destination.trigger("focus");
				destination.select();
			}
		}
	);
}

/**
 * Preenchimento de opcoes de uma lista suspensa (select) atraves de ajax
 * apos serem inseridos caracteres em uma caixa de entrada de texto (input)
 * @param caller Identificacao da caixa de texto (seletor CSS)
 * @param targetSelect Lista (select) a ser preenchida
 * @param emptyWarning Aviso caso nao sejam encontrados resultados compativeis
 * @param minQuery Tamanho minimo do texto para pesquisa
 * @param command Comando a ser invocado para retornar os valores
 * @param paramTerm Parametro de command que recebe o texto para busca
 */
function searchSelectAjax(caller, targetSelect, emptyWarning, minQuery, command, paramTerm){
	$(caller).on(
		'keyup',
		function() {
			var queryString = $.trim($(caller).val());
			var container = $(targetSelect);
			var emptyField = "<option value=''>" + emptyWarning + "</option>";

			if (queryString.length < minQuery) {
				container.html(emptyField);
				return;
			}
			else {
				container.html("<option value=''>Aguarde...</option>");
				$.post(
					"Controlador",
					{command: command, [paramTerm]: queryString},
					function(data){
						if (data == "") {
							container.html(emptyField);
						}
						else {
							container.html(data);
						}
					}
				);
			}
		}
	);
}

/**
 * Funcao que faz um bind do evento de clique a um
 * elemento (triggerId), associando a ele a funcao que exibe uma
 * caixa com mensagens de ajuda (helpFile).
 * Requer o item que ativa a tela de ajuda (triggerId)
 * e o nome do arquivo (helpFile) em que esta contido o texto da ajuda,
 * informado sem a extensao.
 * O arquivo helpFile deve estar na pasta "ajuda" e ter extensao ".jsp".
 * @param triggerId
 * @param helpFile
 * @param visivel boolean que indica se a ajuda sera exibida imediatamente
 */
function bindHelpTrigger(triggerId, helpFile, visivel){
	var trigger = $('#' + triggerId );
	var referencePoint;

	if ( trigger.parent().is("body") ) {
		referencePoint = trigger;
	}
	else {
		referencePoint = trigger.parent();
	}

	trigger.click(function() {
		if (! $("#helpContainer").is("div") ){
			referencePoint.after("<div id='helpContainer'></div>");
			$("#helpContainer")
				.hide()
				.load("ajuda/" + helpFile + ".jsp")
				.addClass("alert alert-info")
				.toggle();
		}
		else{
			$("#helpContainer").toggle();
		}
	});

	if(visivel){
		trigger.click();
	}
}

/**
 * Mantenedor da sessao ativa para telas de edicao
 * em que a entrada dos dados pode ser demorada.
 * Renova a sessao em intervalos (tMinutes)
 * caso haja interacao com os itens selecionados (selectors)
 * @param tMinutes Tempo em minutos para renovar a sessao
 * @param selectors Seletores CSS
 */
function sessionKeeper(selectors, tMinutes){
	var interagiu = false;
	$(document).on(
		"click change keydown",
		selectors,
		function() {
			interagiu = true;
		}
	);

	setInterval(function() {
		if (interagiu) {
			$.get( "Controlador?command=Ping&p=" + (new Date()).getTime() );
			interagiu = false;
		}
	}, Math.round(tMinutes * 60 * 1000));
}

/**
 * Completa campos de hora com ":" e faz a navegacao
 * para o campo seguinte quando a hora estiver formatada.
 * @param selectorString O seletor dos campos de hora ou
 * do pai desses campos que vai processar o evento.
 * @param filterString O filtro para os filhos que vão disparar
 * o evento para o pai processar. Pode ser nulo.
 */
function completaDoisPontosHorarioKeyup( selectorString, filterString ) {
	$(selectorString).on(
		'keyup',
		filterString,
		function(event) {
			// se numeros
			if((event.keyCode >= 96 && event.keyCode <= 105) || (event.keyCode >= 48 && event.keyCode <= 57)) {
				var valor = $(this).val();
				if( valor.search(/^[3-9]([0-5]?|[0-5]\d)$/) == 0 ) {
					// adiciona ":"
					$(this).val($(this).val().substring(0, 1) + ":" + $(this).val().substring(1));
				}
				else if( valor.search(/^([0-1]\d|2[0-3])([0-5]?|[0-5]\d)$/) == 0 ) {
					// adiciona ":"
					$(this).val($(this).val().substring(0, 2) + ":" + $(this).val().substring(2));
				}
				// se completo
				else if( valor.search(/^([0-1]?\d|2[0-3]):([0-5]\d)$/) == 0 ) {
					// foca no proximo campo
					$(this).parent().parent().next().find("input[type='text']").focus();
				}
			}
		}
	);
}

/**
 * Ativa a completacao de virgulas em campos de notas.
 * @param selectors Seletores jQuery dos campos.
 */
function ativaCompletaVirgula(selectors) {
	$(selectors).keyup(function(event) {
		// se numeros
		if((event.keyCode >= 96 && event.keyCode <= 105) || (event.keyCode >= 48 && event.keyCode <= 57)) {
			var valor = $(this).val();
			if( valor.search(/^\d\d$/) == 0 ) {
				// adiciona "," no meio
				$(this).val($(this).val().substring(0, 1) + "," + $(this).val().substring(1));
			}
			// adiciona ou corrige a virgula
			else if( valor == '100' || valor == '1,00' ) {
				// foca no proximo campo
				$(this).val('10,0');
			}
		}
	});
}

/**
 * Define o estilo dos resultados de solicitacao/cancelamento de matricula
 * para diferenciar as mensages de sucesso das de erro
 */
function resultadoMatriculaStyle() {
	$("td[data-content-message=matriculaStatus]").each(function(){
		var erroExp = /^ERRO: /;

		if ( $(this).text().match(erroExp) ) {
			$(this).addClass('danger');
		}
		else {
			$(this).addClass('success');
		}
	});
}

/**
 * Ativa a seleção do conteúdo de inputs
 * quando eles recebem foco.
 */
function selecionaAoFocar(selectorString, filterString) {
	$(selectorString).on(
		'focus',
		filterString,
		function(event) {
			$(this).select();	
		}
	);
}

//Aplica borda externa a tabelas dentro de uma classe "mobile-responsive"
$(document).ready(function(){
	$(".table-responsive").has(".table-bordered").css("border", "1px solid #ddd");
});
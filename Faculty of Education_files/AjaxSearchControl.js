function autoComplete(controlId, searchLinkId, handlerUrl, itemCount,
					  initialText, queryString, resultPageUrl, 
					  initialSearchString, typeDelay, charSearchLength, clearInitialText) {
	var _textBoxSelector = "#" + controlId;

	$(_textBoxSelector).autocomplete({
		source: function (request, response) {
			$.ajax({
				url: handlerUrl + "?" + queryString + "=" + request.term,
				dataType: "json",
				contentType: "application/json; charset=utf-8",
				context: document.body,
				data: { itemsToDisplay: itemCount },
				success: function (data) {
					response($.map(data, function (item) {
						return {
							label: item.label,
							value: item.value
						}
					}));
				}
			});
		},
		minLength: charSearchLength,
		delay: typeDelay,
		html: true,
		select: function (event, ui) {
			var selectedItem = $(ui.item.label);
			var _linUrl = selectedItem.find("redirectUrl").attr('url');
			window.location = _linUrl;
		}
	});
	$(_textBoxSelector).focus(function () {
		if ($(this).val() == initialText) {
			if (clearInitialText) {
				$(this).val('');
			}
			$(this).addClass("SelectedSearchControl");
		}
	});
	$(_textBoxSelector).blur(function () {
		if ($(this).val() == "") {
			$(this).val(initialText);
			$(this).removeClass("SelectedSearchControl");
		}
	});
	$(_textBoxSelector).keypress(function (eventArgs) {
		if (eventArgs.which == 13) {
			if ($(_textBoxSelector).val() == '') {
				return false;
			}
			if ($("#ui-active-menuitem").length == 0) {
				window.location = resultPageUrl + "?" + queryString + "=" + $(_textBoxSelector).val() + "&s=All Sites";
				return false;
			}
		}
	});

	$("#" + searchLinkId).click(function () {
		if ($(_textBoxSelector).val() == '' || $(_textBoxSelector).val() == initialSearchString) {
			return false;
		}
		else {
			window.location = resultPageUrl + "?" + queryString + "=" + $(_textBoxSelector).val();
			return false;
		}
	});
}
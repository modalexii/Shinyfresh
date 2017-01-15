function param(name) {
	//https://stackoverflow.com/questions/19491336/get-url-parameter-jquery-or-how-to-get-query-string-values-in-js/39768285#39768285
    return (location.search.split(name + '=')[1] || '').split('&')[0];
}

function injectCSS() {
	// append css for admin bar
	$('head').append('<link rel="stylesheet" type="text/css" href="/static/style/admin_bar.css">');
}

function loadControlState(state) {
	switch(state) {
	case 'save_clicked':
		$('#savethis').html('<img src="/static/image/wait.gif" class=buttonwaiter"/>');
		$('#savethis').off('click');
		break;
	case 'save_failed':
		$('#savethis').html('Save');
		assignButtonFunctions();
		break;
	case 'delete_clicked':
		$('#deletethis').html('<img src="/static/image/wait.gif" class=buttonwaiter"/>');
		$('#deletethis').off('click');
		break;
	case 'delete_failed':
		$('#deletethis').html('Delete');
		assignButtonFunctions();
		break;
	case 'newpage_clicked':
		$('#newpage').html('<img src="/static/image/wait.gif" class=buttonwaiter"/>');
		$('#newpage').off('click');
		$('#editthis').prop( "disabled", true );
		$('#deletethis').prop( "disabled", true );
		$('#managefiles').prop( "disabled", true );
		$('#cancelthis').show();
		$('#templateselect').show();
		break;
	case 'templateselect_change':
		$('#newpage').prop( "disabled", true );
		$('#templateselect').prop( "disabled", true );
		break;
	case 'logout_clicked':
		$('#logout').html('<img src="/static/image/wait.gif" class=buttonwaiter"/>');
		$('#logout').off('click');
		break;
	case 'managefiles_clicked':
		if ($('#filemanager').is(':visible')) {
			$('#filemanager').hide();
		} else {
			$('#filemanager').show();
		}
		break;
	case 'edit_mode':
		$('#editthis').hide();
		$('#deletethis').hide();
		$('#newpage').hide();
		$('#savethis').show();
		$('#pagetitle').show();
		$('#cancelthis').show();
		$('.insertobject').show();
		break;
	case 'newpage_editor':
		$('#editthis').hide();
		$('#deletethis').hide();
		$('#newpage').hide();
		$('#templateselect').hide();
		$('#filemanager').hide();
		break;
	default:
		$('#savethis').hide();
		$('#cancelthis').hide();
		$('#templateselect').hide();
		$('#newpath').hide();
		$('#pagetitle').hide();
		$('#filemanager').hide();
		break;
	}
}

function enterEditMode() {
	loadControlState('edit_mode');
	$('#meat').prop('contenteditable',true);
	$('#pagetitle').val(document.title)
	CKEDITOR.inline('meat', {
		startupFocus: true
	} );
}

function disableEditing() {
	if ( CKEDITOR.instances.meat ) {
		CKEDITOR.instances.meat.destroy();
	}
}

function savePage() {
	// disable button, scrape content, post back to same path
	if ((window.location.pathname) === "/new") {
		alert('Please enter a new name or path in the text field. The name "/new" is reserved.');
	} else {
		loadControlState('save_clicked');
		disableEditing();
		// trigger a change to update the document title 
		// incase the default value was left
		$('#pagetitle').change()
		var content = $('#meat').html();
		// capture the template value (only present in the new page editor)
		var template = param('template');
		$.post(window.location.pathname, {
			'title' :  document.title,
			'content' : content,
			'template' : template,
			'_intent' : 'set',
		})
		.done(function() {
			location.reload();
		})
		.fail(function() {
			// reenable button and inform client
			loadControlState('save_failed');
			alert('Sorry, the save didn\'t go through. Try again - this may be an internet blip. If this condition persists, there may be a bug.');
		});
	}
}

function deletePage() {
	// disable button, post intent to same path and browse home
	loadControlState('delete_clicked');
	$.post(window.location.pathname, {
		'_intent' : 'delete',
	})
	.done(function() {
		window.location.href = '/';
	})
	.fail(function() {
		// reenable button and inform client
		loadControlState('delete_failed');
		alert('Sorry, the request didn\'t go through. Try again - this may be an internet blip. If this condition persists, there may be a bug.');
	});
}

function createPage() {
	// redirect to /new, with the chosen template in the query string
	var template = $('#templateselect option:selected').val();
	window.location.href = '/new?template=' + template;
}

function toggleFileManager() {
	// show/hide the file manager
	$.get( "/files/").done( function( data ) {
		$.when( $('#filemanager_index').html(data) )
		.done( function() {
			assignDeleteButtonFunctions();
			assignInsertButtonFunctions();
			if ($('#meat').prop('contenteditable') === "true") {
				$('.insertobject').show();
			} else {
				$('.insertobject').hide();
			}
		})
	});
	loadControlState('managefiles_clicked');
}

function assignDeleteButtonFunctions() {
	$('.deletefile').on('click', function() { 
		var $buttonClicked = $(this);
		$.post("/files/delete", {
			'filename' : $buttonClicked.attr('name')
		})
		.done( function() {
			// hide the div containing the thumb, link and button
			$buttonClicked.parent().hide();
		})
	})
}

function assignInsertButtonFunctions() {
	$('.insertobject').on('click', function() { 
		var src = $(this).attr('link');
		var imgHtml = '<img class="inserted" src="' + src + '"></img>';
		var imgHtmlObject = CKEDITOR.dom.element.createFromHtml(imgHtml);
		CKEDITOR.instances.meat.insertElement(imgHtmlObject);
	})
}

function logout() {
	// change button text to wait gif and navigate to the static logout
	loadControlState('logout_clicked');
	window.location.replace('/logout');
}

function assignButtonFunctions() {
	$('#editthis').on('click', function() { enterEditMode(); });
	$('#savethis').on('click', function() {	savePage(); });
	$('#cancelthis').on('click', function() { location.reload(); });
	$('#deletethis').on('click', function() { deletePage(); });
	$('#newpage').on('click', function() { loadControlState('newpage_clicked'); });
	$('#templateselect').change(function() { createPage(); });
	$('#managefiles').on('click', function() { toggleFileManager(); });
	$('#logout').on('click', function() { logout(); });
	$('#newpath').change(function() { 
		queryString = $('#newpath').val() + location.search;
		window.history.pushState('', '', queryString);
	});
	$('#pagetitle').change(function() { 
		document.title = $('#pagetitle').val();
	});
}

$(document).ready( function() {
	injectCSS();
	assignButtonFunctions();
	if (window.location.pathname === '/new') {
		loadControlState('newpage_editor');
		enterEditMode();
	} else {
		loadControlState('default');
	}
});
/*
function savePage() {
	var resource = $.trim($('input[name="resource"]').prop('value'));
	if(resource == '') {
		alert('Please enter a URI for this page!');
		$('input[name="resource"]').addClass('red_border');
	}
	else {
		$('#save').html('<img src="/static/image/wait.gif" class=buttonwaiter"/>');
		$('#save').off('click');
		// the following assumes that all editable pages are identical
		// content has to be recreated
		// if it is captured with outerHTML, we get all the ckeditor junk too
		var content_template = '<div id="header-sub"><img class="bg-header-sub" src="{0}" width="705px" height="82px"/><h1>{1}</h1></div><!-- /header-sub --><div id="content_sub">{2}</div><!-- /content_sub -->'
		var CKEData = CKEDITOR.instances.content_sub.getData();
		var content = String.format(
			content_template,
			$('img.bg-header-sub').attr('src'),
			$('#header-sub h1').html(),
			CKEData
		);

		$.post('/modify/publish', {
			'content' : content,
			'resource' : resource,
		})
		.done(function() {
			window.location.replace('/' + $.trim(resource));
		})
		.fail(function() {
			alert('Sorry, the save didn\'t go through. Check your internet connection. If this condition persists, please file a bug.');
			$('#save').html('Save');
			$('#save').on('click', function() {
				savePage();
			});
		});
	}
}

function enterEditingMode(newPath) {
	$('#content_sub').prop('contenteditable',true);
	$('#header-sub h1').prop('contenteditable',true);
	$('#editthis').removeClass('admin_link');
	$('#editthis').html(
		'Save to: ' + window.location.hostname + '/' +
		'<input type="text" name="resource" value="' + newPath + '" />' +
		'<div id="save" class="admin_link">Save</div>' +
		'<div id="cancel" class="admin_link">Cancel</div>'
	);
	$('#editthis').addClass('yellow_bg');
	$('#cancel').removeClass('yellow_bg').addClass('red_bg');
	$('#deletethis').hide();
	$('#deletethis').off('click');
	$('#newpage').hide();
	$('#newpage').off('click');
	$('#bannersettings').hide();
	$('#bannersettings').off('click');
	$('#signout').hide();
	$('#signout').off('click');

	// Do not allow headers on these pages to change color
	var locked_header_color = ['/lessons','/store','/rentals','/events','/testimonials']
	if ($.inArray(window.location.pathname, locked_header_color) === -1) {
		$("img.bg-header-sub").on('click', function() {
			if ($("img.bg-header-sub").attr('src') === '/static/image/header-green.png') {
				$("img.bg-header-sub").attr('src','/static/image/header-blue.png');
			} 
			else if ($("img.bg-header-sub").attr('src') === '/static/image/header-blue.png') {
				$("img.bg-header-sub").attr('src','/static/image/header-yellow.png');
			}
			else if ($("img.bg-header-sub").attr('src') === '/static/image/header-yellow.png') {
				$("img.bg-header-sub").attr('src','/static/image/header-red.png');
			}
			else if ($("img.bg-header-sub").attr('src') === '/static/image/header-red.png') {
				$("img.bg-header-sub").attr('src','/static/image/header-purple.png');
			}
			else {
				$("img.bg-header-sub").attr('src','/static/image/header-green.png');
			}
		});
	}

	$('#save').on('click', function() {
		savePage();
	});

	$('#cancel').on('click', function() {
		if(window.location.pathname === '/modify/new') {
			window.location.replace('/');
		}
		else {
			window.location.replace(window.location.pathname);
		}
	});

	// Turn off automatic editor creation first.
	CKEDITOR.disableAutoInline = true;

	try {
		CKEDITOR.inline( 'content_sub' );
		//CKEDITOR.inline( 'content_sub' ); // + line for each div that should spawn a ck instance
	}
	catch(e) {
		console.log('Error attaching in-line editor: ' + e);
	}
}

$(document).ready(function(){

	// define pages that should have delete disabled
	var protectedPages = ["/lessons","/store","/rentals","/repairs","/events","/about","/contact","/testimonials"];

	if (!String.format) {
		// stackoverflow.com/questions/610406/javascript-equivalent-to-printf-string-format
		String.format = function(format) {
			var args = Array.prototype.slice.call(arguments, 1);
			return format.replace(/{(\d+)}/g, function(match, number) { 
				return typeof args[number] != 'undefined'
					? args[number] 
					: match
				;
			});
		};
	}

	$('head').append('<link rel="stylesheet" type="text/css" href="/static/style/admin_bar.css">');
	$('head').append('<script type="text/javascript" src="/static/script/ckeditor/ckeditor.js"></script>');



	$('#newpage').on('click', function() {
		window.location.replace('/modify/new');
	});
	$('#signout').on('click', function() {
		window.location.replace('/modify/logout');
	});
	$('#bannersettings').on('click', function() {
		window.open('/modify/banner', 'banner', 'left=20,top=20,width=960,height=400,toolbar=0,menubar=0,resizable=0');
	});
	$('#upload').on('click', function() {
		window.open('/modify/upload', 'upload', 'left=20,top=20,width=500,height=500,toolbar=0,menubar=0,resizable=0');
	});
	$('.info').on('click', function() {
		window.open('/modify/info', 'info', 'left=20,top=20,width=500,height=500,toolbar=0,menubar=0,resizable=0');
	})
	$('.gcs_dir').on('click', function() {
		window.open('/dres/directory', 'directory', 'left=20,top=20,width=500,height=500,menubar=0,resizable=1');
	})

	if (editable_existing){
		if ($.inArray(window.location.pathname, protectedPages) === -1) {
			$('#deletethis').click(function() {
				if (confirm('Really delete ' + window.location.pathname + ' forever?')) {
					$.post('/modify/delete', {
						'resource' : window.location.pathname,
					})
					.done(function() {
						window.location.replace('/');
					})
					.fail(function() {
						alert('Sorry, the delete request didn\'t go through. Check your internet connection, refresh and try again. If this condition persists, please file a bug.');
					});
				}

			});
		}
		else {
			$('#deletethis').hide();
		}
		$('#editthis').on('click', function() {
			$('#editthis').off('click');
			enterEditingMode(newPath = decodeURIComponent(window.location.pathname.replace('/','')));
		});
	}
	else if (new_editor) {
		enterEditingMode(newPath = ' ');
	}
	else {
		$('#editthis').hide();
		$('#deletethis').hide();
	}

});
*/
function param(name) {
	//https://stackoverflow.com/questions/19491336/get-url-parameter-jquery-or-how-to-get-query-string-values-in-js/39768285#39768285
    return (location.search.split(name + '=')[1] || '').split('&')[0];
}

function injectCSS() {
	// for admin bar
	$('head').append('<link rel="stylesheet" type="text/css" href="/static/style/admin_bar.css">');
}

function copyToClipboard(containerid) {
	if (document.selection) { 
		var range = document.body.createTextRange();
		range.moveToElementText(document.getElementById(containerid));
		range.select().createTextRange();
		document.execCommand("Copy"); 
	} else if (window.getSelection) {
		var range = document.createRange();
		range.selectNode(document.getElementById(containerid));
		window.getSelection().addRange(range);
		document.execCommand("Copy");
	}
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
	case 'edit_mode_wysiwyg':
		$('#editthis').hide();
		$('#deletethis').hide();
		$('#newpage').hide();
		$('#logout').hide();
		$('.button_seperator').hide();
		$('#current_page_label').hide();
		$('#newtile').hide();
		$('#savethis').show();
		$('#pagetitle').show();
		$('#cancelthis').show();
		break;
	case 'edit_mode_gallery':
		$('#editthis').hide();
		$('#deletethis').hide();
		$('#newpage').hide();
		$('#logout').hide();
		$('.button_seperator').hide();
		$('#current_page_label').hide();
		$('#newtile').show();
		$('#savethis').show();
		$('#pagetitle').show();
		$('#cancelthis').show();
		break;
	case 'newpage_editor':
		$('#editthis').hide();
		$('#deletethis').hide();
		$('#newpage').hide();
		$('#templateselect').hide();
		$('#newtile').hide();
		$('#filemanager').hide();
		break;
	default:
		$('#savethis').hide();
		$('#cancelthis').hide();
		$('#templateselect').hide();
		$('#newpath').hide();
		$('#pagetitle').hide();
		$('#newtile').hide();
		$('#filemanager').hide();
		break;
	}
}

function enterWYSIWYGEditMode() {
	loadControlState('edit_mode_wysiwyg');
	$('#meat').prop('contenteditable',true);
	$('#pagetitle').val(document.title)
	CKEDITOR.inline('meat', {
		startupFocus: true
	} );
}

function disableWYSIWYGEditing() {
	if ( CKEDITOR.instances.meat ) {
		CKEDITOR.instances.meat.destroy();
	}
}

function enterGalleryEditMode () {
	loadControlState('edit_mode_gallery');
	
}

function savePage() {
	// disable button, scrape content, post back to same path
	if ((window.location.pathname) === "/new") {
		alert('Please enter a new name or path in the text field. The name "/new" is reserved.');
	} else {
		loadControlState('save_clicked');
		disableWYSIWYGEditing();
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

function launchFileManager() {
	// open the file manager
	window.open('/files/','File Manager').focus()
}

function populateInfoFromThumb (buttonClicked) {
	// given the object representing an image info button,
	// populate the imageinfo lightbox fields

	// scrape properties from thumb that was clicked
	var fileName = $buttonClicked.attr('name');
	var fullUrl = $buttonClicked.siblings('a.thumb').attr('href');
	var metaTitle = $buttonClicked.siblings('div.title').html();
	var metaDescription = $buttonClicked.siblings('div.caption').html();
	var metaDate = $buttonClicked.siblings('div.date').html();
	var metaMedia = $buttonClicked.siblings('div.media').html();

	// assign properties to image info lightbox
	$('img.image_info.thumb').arrt('src', fullUrl + '=s250c');
}

function populateThumbFromInfo (thumb) {

}

function assignDeleteButtonFunctions() {
	$('button.action.delete').on('click', function() { 
		var $buttonClicked = $(this);
		$.post("/files/delete", {
			'filename' : $buttonClicked.attr('name')
		})
		.done( function() {
			// hide the div containing the thumb, link and button
			location.reload();
		})
	})
}

function assignInfoButtonFunctions() {
	$('button.action.info').on('click', function () {
		// scrape properties from thumb that was clicked
		var $buttonClicked = $(this);
		var fileName = $buttonClicked.attr('name');
		var correspondingThumb = $buttonClicked.siblings('a.thumb');
		var fullUrl = correspondingThumb.attr('href');
		var thumbURL = correspondingThumb.children('img').attr('src');
		// assign properties of image info lightbox
		$('#image_info_name').html(fileName);
		$('img.image_info.thumb').attr('src', thumbURL);
		$('input#image_info_url').val(fullUrl);
		$('thumb_to_full').attr('src', fullUrl);
		$('#thumb_to_full').attr('href', fullUrl);
		$('#image_info_delete').attr('name', fileName);
		updateScaledURL();
		window.location.hash = 'imageinfo';
	});
	$('#image_info_url_copy').on('click', function () {
		copyToClipboard('image_info_url');
	});
	$('#image_info_user_copy').on('click', function () {
		copyToClipboard('image_info_user_url');
	});
	// close lightbox on background click
	$('#imageinfo.overlay').on('click', function () {
		window.location.hash = '#';
	});
}

function updateScaledURL() {
	// update the scaled url in the image info lightbox
	var userPixels = $('#image_info_user_size').val();
	var thumbURL = $('img.image_info.thumb').attr('src');
	var userScaleURL = thumbURL.replace(/=s[\d]{1,5}/, '=s' + userPixels);
	$('#image_info_user_url').val(userScaleURL);
}

function logout() {
	// change button text to wait gif and navigate to the static logout
	loadControlState('logout_clicked');
	window.location.replace('/logout');
}

function assignButtonFunctions() {
	$('#editthis').on('click', function() { 
		if ( $('#adminbar').attr('data-mode') === 'standard' ) {
			enterWYSIWYGEditMode();
		} else if ( $('#adminbar').attr('data-mode') === 'gallery' ) {
			enterGalleryEditMode();
		}
	});
	$('#savethis').on('click', function() {	savePage(); });
	$('#cancelthis').on('click', function() { location.reload(); });
	$('#deletethis').on('click', function() { deletePage(); });
	$('#newpage').on('click', function() { loadControlState('newpage_clicked'); });
	$('#templateselect').change(function() { createPage(); });
	$('#managefiles').on('click', function() { launchFileManager(); });
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
		// new page template
		loadControlState('newpage_editor');
		if ( $('#adminbar').attr('data-mode') === 'standard' ) {
			enterWYSIWYGEditMode();
		} else if ( $('#adminbar').attr('data-mode') === 'gallery' ) {
			enterGalleryEditMode();
		}
	} else if (window.location.pathname === '/files/') {
		// file manager
		assignDeleteButtonFunctions();
		assignInfoButtonFunctions();
	} else {
		loadControlState('default');
	}    

});

Dropzone.options.adminBarDropzone = {
    dictDefaultMessage: '&#187; drop or click to upload &#171;',
    autoProcessQueue: true,
    parallelUploads: 1,
    thumbnailWidth: 100,
    complete: function(file) { 
        location.reload();
    }
};
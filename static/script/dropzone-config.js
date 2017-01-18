Dropzone.options.adminBarDropzone = {
    dictDefaultMessage: 'Drop or click to upload',
    autoProcessQueue: true,
    parallelUploads: 1,
    thumbnailWidth: 100,
    complete: function(file) { 
            this.removeFile(file);
            populateThumbnails();
    }
};
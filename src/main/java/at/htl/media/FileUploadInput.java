package at.htl.media;

import java.util.List;

import org.jboss.resteasy.reactive.multipart.FileUpload;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.ws.rs.FormParam;

public class FileUploadInput {
    @FormParam("file")
    @NotNull(message = "At least one file is required")
    @Size(min = 1, max = 20, message = "Upload between 1 and 20 files at once")
    public List<FileUpload> file;
}

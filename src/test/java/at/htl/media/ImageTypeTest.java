package at.htl.media;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import java.nio.file.Files;
import java.nio.file.Path;
import java.awt.image.BufferedImage;
import javax.imageio.ImageIO;
import static org.junit.jupiter.api.Assertions.*;

class ImageTypeTest {
    @TempDir Path dir;
    @Test void rejectsSignaturesWithoutImageData() throws Exception {
        for (byte[] content : new byte[][] {
                {(byte)0x89, 'P','N','G',13,10,26,10}, {(byte)0xff,(byte)0xd8,(byte)0xff},
                "GIF89a".getBytes(), "RIFF0000WEBP".getBytes(), "<svg onload=alert(1)>".getBytes()}) {
            Path file = dir.resolve("spoof.png"); Files.write(file, content);
            assertTrue(ImageType.detect(file).isEmpty());
        }
    }
    @Test void acceptsSupportedRasterDecodersAndRejectsExcessiveDimensions() throws Exception {
        for (String format : new String[]{"png", "jpg", "gif"}) {
            Path file = dir.resolve("valid." + format);
            assertTrue(ImageIO.write(new BufferedImage(2, 2, BufferedImage.TYPE_INT_RGB), format, file.toFile()));
            assertTrue(ImageType.detect(file).isPresent(), format);
        }
        assertTrue(ImageIO.getImageReadersByFormatName("webp").hasNext(), "WebP decoder must be installed");
        Path webp = dir.resolve("valid.webp");
        try (var in = getClass().getResourceAsStream("/validation/valid.webp")) { Files.copy(in, webp); }
        assertEquals(ImageType.WEBP, ImageType.detect(webp).orElseThrow());
        Path file = dir.resolve("huge.png");
        ImageIO.write(new BufferedImage(4100, 4100, BufferedImage.TYPE_BYTE_BINARY), "png", file.toFile());
        assertTrue(ImageType.detect(file).isEmpty());
        Files.write(file, new byte[5 * 1024 * 1024 + 1]);
        assertTrue(ImageType.detect(file).isEmpty());
    }
}

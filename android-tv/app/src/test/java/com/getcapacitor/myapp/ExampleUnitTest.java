package online.streamfree.tv;

import static org.junit.Assert.*;

import org.junit.Test;

/**
 * Example local unit test, which will execute on the development machine (host).
 *
 * @see <a href="http://d.android.com/tools/testing">Testing documentation</a>
 */
public class ExampleUnitTest {

    @Test
    public void canonicalPackageNamespace_isStable() {
        assertEquals("online.streamfree.tv", MainActivity.class.getPackage().getName());
    }
}

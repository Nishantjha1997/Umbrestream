package online.streamfree.tv;

import android.content.pm.ActivityInfo;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "StreamFreeNative")
public class StreamFreeNativePlugin extends Plugin {
    @PluginMethod
    public void lockLandscape(PluginCall call) {
        getActivity().runOnUiThread(() -> getActivity().setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE));
        call.resolve();
    }

    @PluginMethod
    public void lockPortrait(PluginCall call) {
        getActivity().runOnUiThread(() -> getActivity().setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE));
        call.resolve();
    }

    @PluginMethod
    public void installOfficialUpdate(PluginCall call) {
        getActivity().runOnUiThread(() -> ((MainActivity) getActivity()).downloadOfficialUpdate());
        call.resolve();
    }

    @PluginMethod
    public void checkOfficialUpdate(PluginCall call) {
        ((MainActivity) getActivity()).checkOfficialUpdate(call);
    }
}

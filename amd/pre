(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['bean', 'underscore'], function (bean, _) {
            // Also create a global in case some scripts
            // that are loaded still are looking for
            // a global even when an AMD loader is in use.
            return (root.Flotr = factory(bean, _));
        });
    } else {
        // Browser globals
        root.Flotr = factory(root.bean, root._);
    }
}(this, function (bean, _) {


/**
 * Extension to the generic String Object.
 */
Object.extend(RegExp.prototype, {
  call: function(context, value, index) {
    return this.exec(value)
  }
})

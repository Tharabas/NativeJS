#!/usr/bin/env ruby

src_dir    = './src'
ext_dir    = './src/ext'

# grab the files from the source folder

files = Dir.new(src_dir).entries.select { |f| f =~ /.*\.js/ }
files.reject! { |f| f == 'Basic' }
files.reject! { |f| f.downcase != $*[0].downcase + '.js' } if $*.length > 0 and $*[0] != '*'

methodPattern = if $*.length >= 2 then Regexp.compile($*[1]) else /.*/ end
  
dump = true

puts "parsing files in #{src_dir}"

files.each { |filename|
  fullPath = src_dir + '/' + filename
  file = File.open(fullPath, 'r') 
  puts "\n--- #{filename.reverse[3,50].reverse} --- \n"

  scope = ""
  comment = ""
  addComment = false
  index = 0
  file.each_line { |line| 
    index = index + 1
    
    # check for scopes
    scope = $~[1] if line =~ /(\w+(?:\.\w+))\s*=\s*Class.create/
    scope = $~[1] if line =~ /\s*Object\.extend\((\w+(?:\.\w+)*)/
    scope = $~[1] + '.prototype' if line =~ /\s*Object.overwrite\((\w+(?:\.\w+)*)/
    
    # check for comments
    if line =~ /\/\*\*/ then
      # start comment
      addComment = true
      comment = ""
    end
    
    comment += "> " + line.gsub(/^\s*\/\*\*?/, '').gsub(/^\s*\* ?/,'').gsub(/^\s*\*+\//, '') if addComment
    
    addComment = false if line =~ /\*\//
    
    # in-class function definition
    if /\s*(?<methodName>\w+)\s*\:\s*function\s*(\w+)?\s*\((?<methodArgs>.*)\)/ =~ line then
      comment = comment.gsub(/\n(\s*\n)+/, "\n")
      methodArgs = methodArgs.split(/\s*,\s*/)
      
      if dump and methodPattern =~ methodName then
        puts "------ #{scope}.#{methodName} in #{filename}:#{index.to_s} ------"
        puts "< #{methodArgs.length} Arguments: #{methodArgs.join(", ")}"
        puts comment
      end
    end
  }
}

puts '---DONE---'

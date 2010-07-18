#!/usr/bin/env ruby

src_dir    = './src'
ext_dir    = './src/ext'
build_dir  = './build'
build_name = 'native'

# grab the files from the source folder

files = Dir.new(src_dir).entries.select { |f| f =~ /.*\.js/ }

# order by their requirements

# first will always be Basic.js

basic_name = 'Basic.js'

files.reject! { |name| name == basic_name }
files.unshift basic_name

out = File.open(build_dir + '/' + build_name + '.js', 'w')

files.each { |filename|
  file = File.open(src_dir + '/' + filename, 'r') 
  puts "Appending #{File.size(file)} bytes from #{filename}"
  #out.puts "// START #{filename}"
  
  file.each_line { |line| out.puts(line) }
    
  #out.puts "// END #{filename}\n"
}

out.close
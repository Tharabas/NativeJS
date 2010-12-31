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

start_files = %w(
  Basic 
  Framework 
  Function 
  Math 
  Number 
  Array 
  Enumerable 
  String 
  Interval 
  TimeInterval
  Finish
)
start_files.map! { |n| n + '.js' }

files.reject! { |name| start_files.any? { |sf| sf == name } }
start_files.reverse.each { |name| files.unshift name }

build_file_name = build_dir + '/' + build_name + '.js'

out = File.open(build_file_name, 'w')

gitlog = `git log -n1`.split("\n")
build  = gitlog[0].split(" ")[1]
date   = gitlog[2][8,24]

puts "Building #{build_name}.js in #{build_dir}"

# write header
out.puts <<-HEADER
/**
 * NativeJS, JavaScript Extensions
 * Build: #{build}
 * Date:  #{date}
 *
 * Copyright (c) 2001-2011 Ben Schuettler (Tharabas)
 */
HEADER

files.each { |filename|
  fullPath = src_dir + '/' + filename
  file = File.open(fullPath, 'r') 
  filelog = `git log -n1 #{fullPath}`
  puts "+ #{filename.reverse[3,50].reverse} (#{File.size(file)} bytes), #{filelog[2][8,24]}"
  out.puts <<-FILEHEAD
  /**
   * Name:    #{filename}
   * Version: #{filelog[2][8,24]}
   */
  FILEHEAD
  
  file.each_line { |line| out.puts(line) }
}

out.close

puts "--- DONE ---"
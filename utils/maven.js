'use strict';
var cheerio = require('cheerio');
var fse = require('fs-extra');
var beautify = require('js-beautify').html;

/**
Usage:
     var maven = require('utils/maven.js')
     var pom = maven.open('pom.xml');
     pom.addDependency(gav)
     pom.addDependency(groupId, artifactId, version, type, scope)
     pom.containsDependency(groupId, artifactId)

     pom.save(this.fs, filename);
*/

function maven(content) {
  if (typeof content === 'undefined') {
    content = fse.readFileSync('pom.xml', {
      encoding: 'UTF-8'
    })
  }
  var $ = cheerio.load(content, {
    xmlMode: true,
    lowerCaseTags: false
  });

  return {
    convertToXml: function(dep) {
      var $dep = $('<dependency />');
      $dep.append('<groupId>' + dep.groupId + '</groupId>');
      $dep.append('<artifactId>' + dep.artifactId + '</artifactId');
      if (dep.version) {
        $dep.append('<version>' + dep.version + '</version>');
      }
      if (dep.extension) {
        $dep.append('<type>' + dep.extension + '</type>');
      }
      if (dep.classifier) {
        $dep.append('<scope>' + dep.classifier + '</scope>');
      }
      return $dep;
    },
    addDependency: function() {
      var args = Array.prototype.slice.call(arguments, 0);
      if (args.length === 1) {
        args = args[0].split(':');
      }
      if (args.length < 2) {
        return;
      }

      var dep = {
        groupId: args[0],
        artifactId: args[1],
        version: args[2],
        extension: args[3],
        classifier: args[4]
      };

      // Format: <groupId>:<artifactId>[:<version>[:<extension>[:<classifier>]]]
      if (this.containsDependency(dep.groupId, dep.artifactId)) {
        return dep;
      }

      $('dependencies').append(this.convertToXml(dep));
      return dep;
    },
    containsDependency: function(groupId, artifactId) {
      // XXX: Do not only test artifact id :)
      return $('dependencies artifactId').filter(function(i, elt) {
        return $(elt).text() === artifactId;
      }).length > 0;
    },
    dependencies: function() {
      var dependencies = [];
      $('dependencies dependency').each(function(i, elt) {
        var el = $(elt);
        dependencies.push({
          artifactId: el.first('artifactId').text(),
          groupId: el.first('groupId').text()
        });
      });
      return dependencies;
    },
    addModule: function(module) {
      if (!this.containsModule(module)) {
        var $mod = $('<module>' + module + '</module>');
        $('modules').append($mod);
      }
      return module;
    },
    containsModule: function(module) {
      return $('modules module').filter(function(i, elt) {
        return $(elt).text() === module;
      }).length > 0;
    },
    modules: function() {
      var modules = [];
      $('modules module').each(function(i, elt) {
        modules.push($(elt).text());
      });
      return modules;
    },
    save: function(fs, file) {
      fs.write(file, beautify($.xml(), {
        indent_size: 2,
        preserve_newlines: 1
      }));
    }
  };
}

module.exports = {
  open: maven
};

import { describe, it, expect } from 'vitest'
import { jsonToDart, toDartFieldName, toDartClassName } from '@/lib/json/dart'

describe('JSON → Dart Model Conversion Suite', () => {
  it('generates a valid Dart model with fromJson and toJson for flat object', () => {
    const input = {
      id: 1,
      name: 'Alice',
      active: true,
    }
    const dart = jsonToDart(input)
    expect(dart).toContain('class Root {')
    expect(dart).toContain('final int id;')
    expect(dart).toContain('final String name;')
    expect(dart).toContain('final bool active;')
    expect(dart).toContain('Root({')
    expect(dart).toContain('required this.id,')
    expect(dart).toContain('factory Root.fromJson(Map<String, dynamic> json) {')
    expect(dart).toContain("id: json['id'] as int,")
    expect(dart).toContain("name: json['name'] as String,")
    expect(dart).toContain("active: json['active'] as bool,")
    expect(dart).toContain('Map<String, dynamic> toJson() {')
    expect(dart).toContain("'id': id,")
    expect(dart).toContain("'name': name,")
    expect(dart).toContain("'active': active,")
  })

  it('generates separate classes for nested objects', () => {
    const input = {
      user: {
        id: 1,
        name: 'Alice',
      },
    }
    const dart = jsonToDart(input)
    expect(dart).toContain('class Root {')
    expect(dart).toContain('final User user;')
    expect(dart).toContain('class User {')
    expect(dart).toContain(
      "user: User.fromJson(json['user'] as Map<String, dynamic>),"
    )
    expect(dart).toContain("'user': user.toJson(),")
  })

  it('handles primitive lists and object lists', () => {
    const input = {
      tags: ['qa', 'automation'],
      users: [{ id: 1, name: 'Alice' }],
    }
    const dart = jsonToDart(input)
    expect(dart).toContain('final List<String> tags;')
    expect(dart).toContain('final List<User> users;')
    expect(dart).toContain(
      "users: (json['users'] as List<dynamic>).map((e) => User.fromJson(e as Map<String, dynamic>)).toList(),"
    )
    expect(dart).toContain(
      "tags: (json['tags'] as List<dynamic>).map((e) => e as String).toList(),"
    )
    expect(dart).toContain("'users': users.map((e) => e.toJson()).toList(),")
  })

  it('handles nullable fields gracefully without making all fields nullable', () => {
    const input = {
      id: 1,
      nickname: null,
    }
    const dart = jsonToDart(input)
    expect(dart).toContain('final int id;')
    expect(dart).toContain('final dynamic nickname;')
    expect(dart).toContain('required this.id,')
    expect(dart).toContain('this.nickname,')
  })

  it('sanitizes reserved words and hyphenated property names while preserving JSON keys', () => {
    const input = {
      'first-name': 'Alice',
      'user.email': 'alice@example.com',
      default: true,
      '123order': 99,
    }
    const dart = jsonToDart(input)

    expect(dart).toContain('final String firstName;')
    expect(dart).toContain("firstName: json['first-name'] as String,")
    expect(dart).toContain("'first-name': firstName,")

    expect(dart).toContain('final String userEmail;')
    expect(dart).toContain("userEmail: json['user.email'] as String,")

    expect(dart).toContain('final bool defaultValue;')
    expect(dart).toContain("defaultValue: json['default'] as bool,")

    expect(dart).toContain('final int val123order;')
  })

  it('handles root array of objects with typedef and item model', () => {
    const input = [{ id: 1, name: 'Alice' }]
    const dart = jsonToDart(input)

    expect(dart).toContain('typedef Root = List<RootItem>;')
    expect(dart).toContain('class RootItem {')
  })

  it('handles primitive roots and empty arrays gracefully', () => {
    expect(jsonToDart(42)).toContain('typedef Root = int;')
    expect(jsonToDart([])).toContain('typedef Root = List<dynamic>;')
  })

  it('naming helpers sanitize properly', () => {
    expect(toDartFieldName('first-name')).toBe('firstName')
    expect(toDartFieldName('user_profile')).toBe('userProfile')
    expect(toDartFieldName('default')).toBe('defaultValue')
    expect(toDartClassName('user-profile')).toBe('UserProfile')
    expect(toDartClassName('users')).toBe('User')
  })
})
